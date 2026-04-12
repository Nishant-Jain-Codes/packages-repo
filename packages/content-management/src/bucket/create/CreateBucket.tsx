// @ts-nocheck
import { faCamera, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Autocomplete, CircularProgress, FormControlLabel, TextField, Typography, Stack, Tooltip, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BucketCarouselFields from "@/features/content-management/bucket/components/BucketCarouselFields";
import BucketGridFields from "@/features/content-management/bucket/components/BucketGridFields";
import { GenericPopUp } from "@/components/popup/genericPopUp";
import { getConfigFromClientConfig, uploadImages } from "../../services/bannerServices";
import { uploadDocumentsToSalescode, fetchDocumentForDisplay } from "@/services/documentUploadService";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  fetchAllBuckets,
  fetchBucketTypeAllOptions,
  fetchCompany,
  getGridOptionMapping,
} from "../../services/manageBucketService";
import { metaDataBatchPayload, popupType } from "@/types";
import { bucketDesigns, bucketTypes } from "./bucketTypes";
import './GenericImageUploadComponent.css';

import "./CreateBucket.css";
import Switch from "react-switch";
import { Switch as MUISwitch } from '@mui/material';
import {
  bucketInnerComponent,
  bucketTextFieldDataState,
  bucketTextFieldFlagState,
  configFinalReqBody,
  createBucketNavigate,
  CreateBucketProps,
  gridOptionsData,
  primaryTypeState,
  secondaryTypesState,
  UploadImageButtonType,
  viewType, 
} from "./CreateBucketTypes";
import { Loader } from "@/components/loader/Loader";
import { blockInnerComponent, getNewMetaDataConfig, OptionType } from "@/utils/UtilityService";
import { openPopup } from "@/utils/UtilityService";
import { validateWithOtp } from "@/utils/validateOtpPopupActions";
import { manageUpdateAccessObj } from "@/utils/UtilityService";
import BannerSelection from "./BannerSelection";
import { configurationAttributeType } from "@/types";
import { Banner, defaultBucketConfig } from "@/utils/UtilityService";
import { getNewConfiguration, validateMetaDataResponse } from "@/utils/UtilityService";
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";
import BackButton from "@/utils/BackButton";
import { fetchClientConfig, getAvailableBlockOptionsOfType, getBlockMetaData, getClientConfigDomainType, getConfigKeyValue, getLinkedBlock, getUpdatedRoleAppLayoutConfig, getWholeSellerConfiguration, updateSelectedBlockData } from "../../services/manageHomeScreenService";
import { BlockObjType, BlockSelectionState, retailerAppLayoutConfigObj } from "@/features/content-management/block/create/CreateBlockTypes";
import { defaultBlockObj } from "@/features/content-management/block/create/BlockType";
import { getLob } from "@/utils/UtilityService";
import { defaultTokenNew, META_DATA_BATCH_API, tokenNew } from "@/utils/networkServiceSimple";
import axios from "axios";
import { useSelector } from "react-redux";
import { store } from "@/utils/UtilityService";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { pad } from "lodash";


// Hardcoded token and tenant ID for saleshub API
// const SALESHUB_API_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzYWxlc2RiLWF1dGgiLCJpYXQiOjE3Njk1NzkxNjYsImV4cCI6MTc2OTYxNTE2NiwidGVuYW50X2lkIjoiYmlsMTIzNDU2IiwidXNlcl9pZCI6MjMxMzgsInVzZXJuYW1lIjoiYWRtaW5AYmlsLmNvbSIsInJvbGVzIjpbIlRFTkFOVF9BRE1JTiJdfQ.whzef3dgLJtut1PRBD-aZodw6nq5tfURpyPHDA8RZc8";

export const UploadImageButton = (props: UploadImageButtonType) => {
  const {translate}=usePortalTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [displayImage, setDisplayImage] = useState<string>("");

  useEffect(() => {
    if (props.defaultImage && props.useSaleshub) {
      fetchDocumentForDisplay(props.defaultImage).then(setDisplayImage);
    } else if (props.defaultImage) {
      setDisplayImage(props.defaultImage);
    } else {
      setDisplayImage("");
    }
  }, [props.defaultImage, props.useSaleshub]);
  const validateImageAndUpload = (file: File | undefined) => {
    if (file) {
      let fileType = file.type.split('/')[0];
      let fileExtension = file.type.split("/")[1];

      if (fileType === "image") {
        if (
          props.allowedType &&
          ((props.allowedType === "image" && fileExtension !== "png") ||
            (props.allowedType === "gif" && fileExtension !== "gif") ||
            (props.allowedType === "both" && !["png", "gif"].includes(fileExtension)))
        ) {
          openPopup(
            "Alert",
            `Only ${props.allowedType === "both" ? "PNG or GIF" : props.allowedType.toUpperCase()} files are allowed`
          );
          return;
        }
        const allowedGifSizeKB = props.maxGifSize ?? 2.5 * 1024; // default 2.5MB = 2560 KB
        const allowedGifSizeBytes = allowedGifSizeKB * 1024;

        const allowedImageSizeKB = props.maxImageSize ?? 2.5 * 1024; // default 2.5MB = 2560 KB
        const allowedImageSizeBytes = allowedImageSizeKB * 1024;

        if (fileExtension === "gif" && file.size > allowedGifSizeBytes) {
          openPopup("Alert", `GIF size must not exceed ${allowedGifSizeKB} KB`);
          return;
        }else if(fileExtension === "png" && file.size > allowedImageSizeBytes){
          openPopup("Alert", `PNG size must not exceed ${allowedImageSizeKB} KB`);
          return;
        }

        let img = new Image();
        let objectUrl = URL.createObjectURL(file);
        img.onload = function () {
          if (
            img.naturalHeight !== props.resolution.height ||
            img.naturalWidth !== props.resolution.width
          ) {
            openPopup(
              "Alert",
              `The required image resolution is ${props.resolution.width}X${props.resolution.height}. Your image has a resolution of ${img.naturalWidth}X${img.naturalHeight}`
            );
          } else {
            props.setImage(file);
            props.setDefaultImage("");
          }
          URL.revokeObjectURL(objectUrl);
        };
        img.onerror = function () {
          openPopup("Alert", "Failed to load image. Please try again.");
          URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
      } else {
        openPopup("Alert", "Please choose an image");
      }
    }
  };



  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if(event.target?.files){
      //validatation to be written here (if required)
      validateImageAndUpload(event.target.files?.[0]);
    }
  }
  const handleClick = () => {
    if(fileInputRef.current){
      fileInputRef.current.value = "";
      fileInputRef.current.click();
      props.setImage(null);
    }
  }
  const handleCrossButton = () => {
    if(props.image){
      props.setImage(null);
    }
    if(props.defaultImage){
      props.setDefaultImage("");
    }
    setDisplayImage("");
  }
  return (<div className={"genericImageUploadContainer" + (props.className? ` ${props.className}`: "")}>
        <div className="genericImageUpload" 
        onClick={handleClick}
        >
        
          {props.image ? (
            <> 
                <img
                  src={URL.createObjectURL(props.image)}
                  height="60"
                  width="auto"
                  alt="banner preview"
                  style={{ height: '60px', width: 'auto' }}
                />
            </>
          ) : displayImage ? (
            <> 
                <img
                  src={displayImage}
                  height="60"
                  width="auto"
                  alt="banner preview"
                  style={{ height: '60px', width: 'auto' }}
                />
            </>
          ) : (
            <>
              <FontAwesomeIcon fontSize="45px" icon={faCamera} />
              <Typography variant="subtitle1">
              {`${translate(TranslationEnum.common_portal, props.label)} (${props.size || `${props.resolution.width}X${props.resolution.height}`})`}
              </Typography>
            </>
          )}
          <input
            type="file"
            accept={
              props.allowedType
                ? props.allowedType === "image"
                  ? "image/png"
                  : props.allowedType === "gif"
                  ? "image/gif"
                  : "image/png,image/gif"
                : "image/png,image/gif"
            }
            onChange={handleImageUpload}
            hidden
            ref={fileInputRef}
          />
        </div>
        {props.image || displayImage?<div className="genericImageUploadCrossContainer">
          <FontAwesomeIcon
                className="genericImageUploadCross"
                icon={faXmark}
                onClick={handleCrossButton}
            />
        </div> : <></>}
      </div>)
}

function CreateBucket(props: CreateBucketProps) {
const [useBeta, setUseBeta] = useState<boolean>(false);
const carouselDimensions = [
  { label: "210 x 240", width: 210, height: 240 },
  { label: "180 x 120", width: 180, height: 120 }
];
const [selectedDimension, setSelectedDimension] = useState(carouselDimensions[0]);
  const [campaignBannerType, setCampaignBannerType] = useState<"GIF" | "TOGGLE">("GIF");
   const [toggleItems, setToggleItems] = useState<
          {
              id?: string;
              backgroundFile: File | null;
              toggleFile: File | null;
              backgroundUrl: string;
              toggleUrl: string;
          }[]
      >([]);
  const [maxGifSize, setMaxGifSize] = useState<number | undefined>(undefined);
  const [maxImageSize, setMaxImageSize] = useState<number | undefined>(undefined);
  const [viewAll,setViewAll] = useState<boolean>(false);
  const [togglePosition, setTogglePosition] = useState<string | null>(null);
  const [sticky,setSticky] = useState<boolean>(false)
  const [allowed1DGrid,setAllowed1DGrid] = useState<boolean>(false)
  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const newValue = checked ? true : false; 
    setViewAll(newValue)
  };
  const handleStickyToggle = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const newValue = checked ? true : false; 
    setSticky(newValue)
  };
  const {translate}=usePortalTranslation();
  const navigate = useNavigate();
  const [bucketTextFieldData, setBucketTextFieldData] =
    useState<bucketTextFieldDataState>({
      id: "",
      title: "",
      subtitle: "",
    });
  const [bucketTextFieldFlag,setBucketTextFieldFlag] = useState<bucketTextFieldFlagState>({
    id: false,
    title: false,
    subtitle: false
  });
  const location = useLocation();
  const [hideAllInputs,setHideAllInputs] = useState<boolean>(false); //hide all other inputs for update page(partialEdit page)
  const locationState: createBucketNavigate = location.state as createBucketNavigate;
  const currentBucketLocationData = locationState?.currentBucket;
  const bucketConfigurationRef = useRef<any[]>(defaultBucketConfig);
  const [bucketBackgroundType, setBucketBackgroundType] =
    useState<string>("Color");
  const [bucketBackgroundColor, setBucketBackgroundColor] =
    useState<string>("#ffffff");
  const [bucketStaticColor, setBucketStaticColor] =
    useState<string>("");
  const [minBoxes, setMinBoxes] = useState<string>("");
  const [isValidColor, setIsValidColor] = useState<boolean>(true);
  const [bucketBackgroundImage, setBucketBackgroundImage] =
    useState<File | null>(null);
    const [bucketGIFImage, setBucketGIFImage] =
    useState<File | null>(null);
  const [bucketDesign, setBucketDesign] = useState<string>("");
  const [bucketDesignOption,setBucketDesignOption] = useState({
    label: "",
    id: ""
  });
  const [primaryTypeOptions, setPrimaryTypeOptions] = useState<string[]>([]);
  const [primaryType, setPrimaryType] = useState<string>("");
  const [secondaryType, setSecondaryType] = useState<string>("");
  const [packSizes, setPackSizes] = useState<string[]>([]);
  const [pieceSizeDesc, setPieceSizeDesc] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subBrand, setSubBrand] = useState<string[]>([]);
  const [brandCode, setBrandCode] = useState<string[]>([]);
  const [company, setCompany] = useState<string[]>([]);
  const [subCategory, setSubCategory] = useState<string[]>([]);
  const [smartBuys,setSmartBuys] = useState<string[]>([]);
  const [ctg,setCtg] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedPrimaryTypes, setSelectedPrimaryTypes] = useState<string[]>(
    []
  );
  const [selectedPrimaryTypesState, setSelectedPrimaryTypesState] = useState<
    primaryTypeState[] | Banner[]
  >([]);
  const [secondaryBucketTypes, setSecondaryBucketTypes] = useState<string[]>(
    []
  );
  const [view, setView] = useState<viewType>("create");
  const [bucketBackgroundBlobkey, setBucketBackgroundBlobkey] =
    useState<string>("");
    const [bucketBackgroundGIF, setBucketBackgroundGIF] =
    useState<string>("");

  const [popupType, setPopupType] = useState<popupType>("Alert");
  const [openGenericModal, setOpenGenericModal] = useState<boolean>(false);
  const [popupMessage, setPopupMessage] = useState<string>("");
  const [secondaryTypeOptions, setSecondaryTypeOptions] = useState<string[]>(
    []
  );
  const [gridDataMapping,setGridDataMapping] = useState<gridOptionsData[]>([])
  const [showSubmitLoader,setShowSubmitLoader] = useState<boolean>(false);
  const [showLoader,setShowLoader] = useState<boolean>(false);
  const [gridDataLoader,setGridDataLoader] = useState<boolean>(false);
  const [bannerIcon,setBannerIcon] = useState<File | null>(null);
  const [bannerIconBlobKey,setBannerIconBlobKey] = useState<string>("");
  const [titleColorToggle,setTitleColorToggle] = useState<boolean>(false);
  const [subtitleColorToggle,setSubtitleColorToggle] = useState<boolean>(false);
  const bucketConfigExists = useRef<boolean>(false);
  const clientConfigRef = useRef<any[]>([]);
  const allBlocksRef = useRef<BlockObjType[]>([]);
  const [blockSelectionState,setBlockSelectionState] = useState<BlockSelectionState>({
    selectedBlock: defaultBlockObj,
    blockOptions: [],
    blockConfigEnabled: false,
    isChanged: false
  })
  const savedRole:any = useSelector((state: any) => state.roleState.role)
  const [roleOptions, setRoleOptions] = useState<OptionType[]>([]);
  const [startDate, setStartDate] = React.useState<Dayjs | null>(
    null
  );
  let previousDate = new Date();
  previousDate.setDate((new Date()).getDate() - 1);
  const prevDate = dayjs(previousDate).format("YYYY-MM-DD");
  const [endDate, setEndDate] = React.useState<Dayjs | null>(
    null
  );
  const [dateValidation,setDateValidation] = useState({ startDate: "", endDate: "" })
  const togglePositionOptions = [
  { label: "Top Left", value: "topLeft" },
  { label: "Top Right", value: "topRight" },
  { label: "Bottom Left", value: "bottomLeft" },
  { label: "Bottom Right", value: "bottomRight" },
  { label: "Center", value: "center" }
];
  const handleStartDate = (newValue: Dayjs | null) => {
    let message = "";
    let endDateMessage = dateValidation.endDate;
    if(!newValue?.isValid()){
        message = "Not a Valid Date";
    }else if(newValue.format("YYYY-MM-DD")<prevDate){
        message = "Start Date can't be less than yesterday date";
    }
    if(endDate?.isValid() && newValue?.isValid()){
        if(endDate.format("YYYY-MM-DD")<newValue.format("YYYY-MM-DD"))
            endDateMessage = "End Date can't be less than Start Date";
        else
            endDateMessage = "";
    }
    setDateValidation({
        ...dateValidation,
        startDate: message,
        endDate: endDateMessage
    })
    setStartDate(newValue);
  }
  const handleEndDate = (newValue: Dayjs | null) => {
    let message = "";
    if(!newValue?.isValid()){
        message = "Not a Valid Date"
    }else if(startDate?.isValid){
        if(newValue.format("YYYY-MM-DD")<startDate.format("YYYY-MM-DD")){
            message = "End Date can't be less than Start Date";
        }
    }
    setDateValidation({
        ...dateValidation,
        endDate: message
    })
    setEndDate(newValue);
  }
  const [wholeSellerConfig, setWholeSellerConfig] = useState<boolean>(false);
  const [companyGridConfig, setCompanyGridConfig] = useState<boolean>(false);
  const [saleshubPostAPI, setSaleshubPostAPI] = useState<boolean>(false);
  const [useSaleshub, setUseSaleshub] = useState<boolean>(false);

  const transformBucketToSaleshubPayload = (bucket: any) => {
    const type = bucket.primarySource || "";
    const primaryOptions = Array.isArray(bucket.primarySourceOptions)
      ? bucket.primarySourceOptions
      : [];
    const tags = primaryOptions
      .map((opt: any) => opt?.name)
      .filter((v: any) => typeof v === "string" && v.trim().length > 0);

    return {
      id: bucket.id,
      name: bucket.title || "",
      type: type ? String(type).toUpperCase() : "",
      config: {
        tags,
      },
      active: bucket.statusEnabled !== false,
    };
  };
  useEffect(() => {
    const fetchPortalConfig = async () => {
      // const portalConfig = await getMetaDataConfig("clientconfig", "portal_configuration");
      // const portal_config: configurationAttributeType[] = portalConfig?.domainValues ?? [];
      const clientConfig = await getNewMetaDataConfig();
      const portal_config: configurationAttributeType[] =
        clientConfig?.find((config: any) => config.domainType === "portal_configuration")?.domainValues ?? [];

      const wholeSellerCfg = portal_config?.find(
        (item) => item.name === "wholeSellerConfig"
      )?.value ?? false;
      const companyGridCfg = portal_config?.find(
        (item) => item.name === "companyGridConfig"
      )?.value ?? false;
      const saleshubPostAPIVal = portal_config?.find(
        (item) => item.name === "saleshubPostAPI"
      )?.value ?? false;
      const useSalesHub = portal_config?.find(
        (item) => item.name === "useSaleshub"
      )?.value ?? false;

      setWholeSellerConfig(wholeSellerCfg);
      setCompanyGridConfig(companyGridCfg);
      setSaleshubPostAPI(saleshubPostAPIVal);
      setUseSaleshub(useSalesHub);
      const bannerConfig = await getNewMetaDataConfig('banner_configuration');
      const bannerConfigValue = bannerConfig && bannerConfig?.domainValues?.[0].value;
      const bannerGIF = bannerConfigValue && bannerConfigValue.find((item: { name: string; }) => item.name === "maxGifSize");
      const bannerImage = bannerConfigValue && bannerConfigValue.find((item: { name: string; }) => item.name === "maxImageSize");
      setMaxGifSize(bannerGIF?.value);
      setMaxImageSize(bannerImage?.value)
    };
    fetchPortalConfig();
  }, []);
  useEffect(() => {
    async function fetchAndSetAllTypes() {
      setShowLoader(true);
      const clientConfig = await fetchClientConfig();
      clientConfigRef.current = clientConfig;
      const bucketConfig = getConfigFromClientConfig(clientConfig,"bucket_configuration");
      const role = "retailer";
      const RoleConfigName = `${savedRole?.id}_app_layout_configuration`;
      let betaConfig = clientConfig.find((config: any) => {
        return config.domainType === "beta_configuration";
      })?.domainValues;
      const betaBlocks = betaConfig?.find((configObj: retailerAppLayoutConfigObj) => {
        return configObj.name === "homeScreenBlockWidget";
      })?.value ?? [];
      let useBeta = false;
      if (Array.isArray(betaBlocks) && betaBlocks.length > 0) {
        setUseBeta(true);
         
        useBeta = true;
      }
      const roleAppLayoutConfig = getConfigFromClientConfig(clientConfig,RoleConfigName);

      const allBlocks = useBeta ? betaBlocks : getConfigKeyValue(roleAppLayoutConfig,"homeScreenBlockWidget")
      const newBlockSelectionState = {...blockSelectionState}
      if(allBlocks && Array.isArray(allBlocks)){
        newBlockSelectionState.blockConfigEnabled = true;
        allBlocksRef.current = allBlocks;
      }else{
        allBlocksRef.current = []
      }
      let currentBucket = currentBucketLocationData;
      if(bucketConfig){
        const allBuckets = bucketConfig?.[0]?.value || [];
        const has1DGridBucket = allBuckets.some(
          (bucket: any) => bucket.bucketDesign === "1DGrid"
        );
        setAllowed1DGrid(!has1DGridBucket);
        bucketConfigurationRef.current = bucketConfig;
        bucketConfigExists.current = true;
        if(currentBucketLocationData){
          const tempCurBucket = bucketConfig[0].value.find((bucketData: any) => {
            return bucketData.id === currentBucketLocationData.id;
          });
          currentBucket = tempCurBucket ?? currentBucket;
        }
      }
      let portal_config = clientConfig.find((config: any) => {
        return config.domainType === "portal_configuration";
      })?.domainValues;
      const useSalesHubAPI = portal_config?.find(
        (item) => item.name === "useSaleshub"
      )?.value ?? false;
      const pieceSizeOptions = await fetchBucketTypeAllOptions("pieceSizeDesc",useSalesHubAPI);
      setPieceSizeDesc(pieceSizeOptions);
      const packSizeOptions = await fetchBucketTypeAllOptions("pieceSize",useSalesHubAPI);
      setPackSizes(packSizeOptions);
      const categoryOptions = await fetchBucketTypeAllOptions("category",useSalesHubAPI);
      setCategories(categoryOptions);
      const brandOptions = await fetchBucketTypeAllOptions("brand",useSalesHubAPI);
      setBrands(brandOptions);
      const smartBuyOptions = await fetchBucketTypeAllOptions("smartBuy",useSalesHubAPI);
      setSmartBuys(smartBuyOptions);
      const ctgOptions = await fetchBucketTypeAllOptions("ctg",useSalesHubAPI);
      setCtg(ctgOptions);
      const subCategoryOptions = await fetchBucketTypeAllOptions("subCategory",useSalesHubAPI);
      setSubCategory(subCategoryOptions);
      const subBrandOptions = await fetchBucketTypeAllOptions("subBrand",useSalesHubAPI);
      setSubBrand(subBrandOptions);
      const brandCodeOptions = await fetchBucketTypeAllOptions("brandCode",useSalesHubAPI);
      let app_config = clientConfig.find((config: any) => {
        return config.domainType === "app_configuration";
      })?.domainValues;
      const companyDetailsList = app_config?.find(
        (item) => item.name === "companyDetailsList"
      )?.value ?? [];
      const companyList = companyDetailsList.map((item: any) => item.id)
      setCompany(companyList);
      const companyOptions = companyList
      setBrandCode(brandCodeOptions);
      // const companyOptions = await fetchBucketTypeAllOptions("source",useSalesHubAPI);
      // if(companyOptions){
      //   setCompany(companyOptions);
      // }
      if(locationState?.blockData){
        
        setBucketDesign(locationState?.blockData.bucketDesign);
        const selectedBucketDesignOption = bucketDesigns.find((option: {id: string,label: string}) => option.id === locationState?.blockData.bucketDesign );
        setBucketDesignOption(selectedBucketDesignOption!);

        const templateFilteredBlocks = getAvailableBlockOptionsOfType("Bucket", allBlocks!, locationState?.blockData.bucketDesign);
            setBlockSelectionState((prevState) => {
                return {
                    ...prevState,
                    blockOptions: templateFilteredBlocks,
                    selectedBlock: locationState?.blockData,
                    isChanged: true,
                    blockConfigEnabled: true
                }
            })
            // console.log("blockSelectionState",blockSelectionState)
      }
      if (currentBucket) {
        if(newBlockSelectionState.blockConfigEnabled){
          const availableBlockOptions = getAvailableBlockOptionsOfType("Bucket",allBlocks!,currentBucket.bucketDesign)
          const linkedBlock = getLinkedBlock(allBlocks!,"Bucket",currentBucket.id);
          if(linkedBlock?.id){
            newBlockSelectionState.selectedBlock = linkedBlock;
            newBlockSelectionState.blockOptions = [...availableBlockOptions,linkedBlock];
          }else{
            newBlockSelectionState.blockOptions = [...availableBlockOptions];
          }
        }
        setView("edit");
        setHideAllInputs(true);
        const { id, title, subtitle, primarySource,viewAll, sticky, minBoxes,togglePosition, selectedDimension: savedDimension } = currentBucket;
        if(viewAll){
          setViewAll(viewAll)
        }
        if(togglePosition){
          setTogglePosition(togglePosition)
        }
        if(sticky){
          setSticky(sticky)
        }
        if(minBoxes){
          setMinBoxes(minBoxes)
        }
        setBucketTextFieldData({ id, title, subtitle });
        setTitleColorToggle(Boolean(currentBucket.titleColor==="#ffffff"))
        setSubtitleColorToggle(Boolean(currentBucket.subTitleColor==="#ffffff"));

        setBucketDesign(currentBucket.bucketDesign);
        const selectedBucketDesignOption = bucketDesigns.find((option: {id: string,label: string}) => option.id === currentBucket.bucketDesign );
        setBucketDesignOption(selectedBucketDesignOption!);
        setPrimaryType(primarySource==="pieceSize"? "Pack Size" : primarySource==="pieceSizeDesc"? "Piece Size Description" : primarySource);
        let allPrimaryOptions:string[] = [];
          if (primarySource === "pieceSize") {
            allPrimaryOptions = packSizeOptions;
          } else if (primarySource === "Category") {
            allPrimaryOptions = categoryOptions;
          } else if(primarySource === "Brand"){
            allPrimaryOptions = brandOptions;
          }else if(primarySource === "Company"){
            allPrimaryOptions = companyOptions;
          }else if(primarySource === "Sub Brand"){
            allPrimaryOptions = subBrandOptions;
          }else if(primarySource === "Brand Code"){
            allPrimaryOptions = brandCodeOptions;
          }else if(primarySource === "Sub Category"){
            allPrimaryOptions = subCategoryOptions;
          }else if(primarySource === "pieceSizeDesc"){
            allPrimaryOptions = pieceSizeOptions;
          }else if(primarySource === "Ctg"){
            allPrimaryOptions = ctgOptions;
          }else {
            allPrimaryOptions = smartBuyOptions;
          }
        if (currentBucket.bucketDesign === "Carousel" || currentBucket.bucketDesign === "1DGrid") {
          if (currentBucket.backgroundColor) {
            setBucketBackgroundType("Color");
            setBucketBackgroundColor(currentBucket.backgroundColor);
          } else {
            setBucketBackgroundType("Image");
            setBucketBackgroundBlobkey(currentBucket.backgroundBlobKey);
            setBucketStaticColor(currentBucket.bucketStaticColor);
          }
          // Autofill selectedDimension for Carousel
          if (currentBucket.bucketDesign === "Carousel" && savedDimension) {
            const found = carouselDimensions.find(dim => dim.label === savedDimension.label && dim.width === savedDimension.width && dim.height === savedDimension.height);
            if (found) setSelectedDimension(found);
          }
          const primaryTypesState = currentBucket.primarySourceOptions.map(
            (option: any) => {
              const value = option.name;
              delete option.name;
              return {
                ...option,
                inputRef: null,
                value
              };
            }
          );
          const finalPrimaryOptions = allPrimaryOptions.filter(
            (option: string) => {
              const index = primaryTypesState.findIndex(
                (primaryOption: primaryTypeState) => {
                  return option === primaryOption.value;
                }
              );
              return index === -1;
            }
          );
          setPrimaryTypeOptions(finalPrimaryOptions);
          setSelectedPrimaryTypesState(primaryTypesState as primaryTypeState[]);

        } else if (currentBucket.bucketDesign === "Grid") {
          const secondarySource = currentBucket.secondarySource;
          const tempSecondaryType = secondarySource==="pieceSize"? "Pack Size" : secondarySource==="pieceSizeDesc"? "Piece Size Description" : secondarySource;
          setSecondaryType(tempSecondaryType);
        let allSecondaryOptions:string[] = [];
        if (secondarySource === "pieceSize") {
          allSecondaryOptions = packSizeOptions;
        } else if (secondarySource === "Category") {
          allSecondaryOptions = categoryOptions;
        } else if(secondarySource === "Brand") {
          allSecondaryOptions = brandOptions;
        }else if(primarySource === "Company"){
          allSecondaryOptions = companyOptions;
        }else if(primarySource === "Sub Brand"){
          allSecondaryOptions = subBrandOptions;
        }else if(primarySource === "Brand Code"){
          allSecondaryOptions = brandCodeOptions;
        }else if(primarySource === "Sub Category"){
          allSecondaryOptions = subCategoryOptions;
        }else if(secondarySource === "pieceSizeDesc") {
          allSecondaryOptions = pieceSizeOptions;
        }else if(secondarySource === "Ctg") {
          allSecondaryOptions = ctgOptions;
        }else{ 
          allSecondaryOptions = smartBuyOptions;
        }
        let portal_config = clientConfig.find((config: any) => {
          return config.domainType === "portal_configuration";
        })?.domainValues;
        const useSalesHubAPI = portal_config?.find(
          (item) => item.name === "useSaleshub"
        )?.value ?? false;
        const gridData = await getGridOptionMapping(primarySource==="pieceSize"? "Pack Size" : primarySource==="pieceSizeDesc"? "Piece Size Description" : primarySource,tempSecondaryType,allPrimaryOptions,useSalesHubAPI);
        setGridDataMapping(gridData);
        const primarySourceOptions = currentBucket.primarySourceOptions.map((primaryOption: any) => {
            return {
              id: primaryOption.id,
              inputRef: null,
              value: primaryOption.name,
              blobKey: primaryOption.blobKey,
              color: primaryOption.color,
              activeStatus: primaryOption.activeStatus,
              secondaryTypeOptions: primaryOption.secondarySourceOptions.map((secondaryOption:any) => {
                return {
                  id: secondaryOption.id,
                  inputRef: null,
                  value: secondaryOption.name,
                  blobKey: secondaryOption.blobKey,
                }
              }),
              availableSecondaryTypes: gridData.find((gridOption: gridOptionsData) => {
                return gridOption.name === primaryOption.name;
              })?.secondaryOptions?.filter((secondaryOptionName: string) => {
                return primaryOption.secondarySourceOptions.findIndex((secondaryOption: any) => secondaryOption.name === secondaryOptionName) === -1
              }) || [],
              selectedSecondaryTypes: [],
            }
          })
          const finalPrimaryOptions = allPrimaryOptions.filter(
            (option: string) => {
              const index = primarySourceOptions.findIndex(
                (primaryOption: primaryTypeState) => {
                  return option === primaryOption.value;
                }
              );
              return index === -1;
            }
          );
          setPrimaryTypeOptions(finalPrimaryOptions);
          setSelectedPrimaryTypesState(primarySourceOptions as primaryTypeState[]);
        }else if(currentBucket.bucketDesign==="Need Based Basket Banner"){
          if (currentBucket.backgroundColor) {
            setBucketBackgroundType("Color");
            setBucketBackgroundColor(currentBucket.backgroundColor);
          } else {
            setBucketBackgroundType("Image");
            setBucketBackgroundBlobkey(currentBucket.backgroundBlobKey);
          }
          setBannerIconBlobKey(currentBucket.bannerIconBlobKey)
        }else if(currentBucket.bucketDesign==="campaignBanner"){
          
          if (currentBucket.backgroundColor) {
            setBucketBackgroundColor(currentBucket.backgroundColor);
          }
          if (currentBucket.backgroundGIFBlobKey) {
            setBucketBackgroundGIF(currentBucket.backgroundGIFBlobKey);
          }
          if(currentBucket.startDate){
          setStartDate(dayjs(currentBucket.startDate));
          }
          if(currentBucket.endDate){
          setEndDate(dayjs(currentBucket.endDate));
          }
          if (currentBucket.backgroundGIFBlobKey) {
            // if GIF present and no items - GIF type
            setBucketBackgroundGIF(currentBucket.backgroundGIFBlobKey);
            // default to GIF unless items exist
            setCampaignBannerType("GIF");
          }
          if (currentBucket.items && Array.isArray(currentBucket.items) && currentBucket.items.length > 0) {
            // items exist -> toggle mode
            // map items to include id (optional) and no files (yet)
            const mappedItems = currentBucket.items.map((it: any, idx: number) => ({
              backgroundUrl: it.backgroundUrl || "",
              toggleUrl: it.toggleUrl || "",
              backgroundFile: null,
              toggleFile: null,
              id: it.id || `item-${idx}`
            }));
            setToggleItems(mappedItems);
            setCampaignBannerType("TOGGLE");
          }

        }
      }
      if(!locationState?.blockData){
        setBlockSelectionState(newBlockSelectionState);
      }
      setShowLoader(false);
    }
    fetchAndSetAllTypes();
  }, [savedRole]);
  
  // console.log("blockSelectionState",blockSelectionState)
  function renderBucketTypeInputs() {
    switch (bucketDesign) {
      // case "1DGrid":
      // case "Carousel": {
      //   return (
      //     <BucketCarouselFields
      //       width={bucketDesign === "1DGrid" ? 72 : 210}
      //       heigth={bucketDesign === "1DGrid" ? 32 : 240}
      //       bucketDesign={bucketDesign}
      //       bucketTextFieldData={bucketTextFieldData}
      //       view={hideAllInputs? "partialEdit" : view}
      //       selectedPrimaryTypes={selectedPrimaryTypes}
      //       primaryTypeOptions={primaryTypeOptions}
      //       primaryType={primaryType}
      //       selectedPrimaryTypesState={selectedPrimaryTypesState as primaryTypeState[]}
      //       setSelectedPrimaryTypesState={setSelectedPrimaryTypesState as React.Dispatch<React.SetStateAction<primaryTypeState[]>>}
      //       setSelectedPrimaryTypes={setSelectedPrimaryTypes}
      //       setPrimaryTypeOptions={setPrimaryTypeOptions}
      //     />
      //   );
      // }
      case "1DGrid":
      case "Carousel": {
        const isCarousel = bucketDesign === "Carousel";
        return (
          <>
            {isCarousel && (
              <div style={{ marginTop: "10px" }}>
              <Autocomplete
                options={carouselDimensions}
                value={selectedDimension}
                onChange={(e, newValue) => {
                  if (newValue) setSelectedDimension(newValue);
                  setSelectedPrimaryTypesState([]);
                  setSelectedPrimaryTypes([]);
                }}
                disabled={view !== 'create'}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField {...params} label="Select Dimension" size="small" />
                )}
                sx={{ mb: 2, width: 250 }}
              />
              </div>
            )}

            <BucketCarouselFields
              useSaleshub={useSaleshub}
              width={isCarousel ? selectedDimension.width : 72}
              heigth={isCarousel ? selectedDimension.height : 32}
              bucketDesign={bucketDesign}
              bucketTextFieldData={bucketTextFieldData}
              view={hideAllInputs ? "partialEdit" : view}
              selectedPrimaryTypes={selectedPrimaryTypes}
              primaryTypeOptions={primaryTypeOptions}
              primaryType={primaryType}
              selectedPrimaryTypesState={
                selectedPrimaryTypesState as primaryTypeState[]
              }
              setSelectedPrimaryTypesState={
                setSelectedPrimaryTypesState as React.Dispatch<
                  React.SetStateAction<primaryTypeState[]>
                >
              }
              setSelectedPrimaryTypes={setSelectedPrimaryTypes}
              setPrimaryTypeOptions={setPrimaryTypeOptions}
            />
          </>
        );
      }
      case "Grid": {
        return (
          <>
            {!hideAllInputs && <>
              <label className="create-basket-input-labels">
              {translate(TranslationEnum.manage_bucket,"BUCKET SUB-TYPE")}
              </label>
              <Autocomplete
                disableClearable
                sx={{ width: "100%" }}
                value={secondaryType}
                onChange={async (event, value: string) => {
                  setGridDataLoader(true);
                  setSecondaryType(value);
                  let tempPrimaryOptions: string[];
                  if (primaryType === "Pack Size") {
                    setPrimaryTypeOptions(packSizes);
                    tempPrimaryOptions = packSizes;
                  } else if (primaryType === "Category") {
                    setPrimaryTypeOptions(categories);
                    tempPrimaryOptions = categories;
                  } else if (primaryType === "Brand") {
                    setPrimaryTypeOptions(brands);
                    tempPrimaryOptions = brands;
                  }else if (primaryType === "Company") {
                    setPrimaryTypeOptions(company);
                    tempPrimaryOptions = company;
                  }else if (primaryType === "Sub Category") {
                    setPrimaryTypeOptions(subCategory);
                    tempPrimaryOptions = subCategory;
                  }else if (primaryType === "Sub Brand") {
                    setPrimaryTypeOptions(subBrand);
                    tempPrimaryOptions = subBrand;
                  } else if (primaryType === "Piece Size Description") {
                    setPrimaryTypeOptions(pieceSizeDesc);
                    tempPrimaryOptions = pieceSizeDesc;
                  }else if (primaryType === "Brand Code") {
                    setPrimaryTypeOptions(brandCode);
                    tempPrimaryOptions = brandCode;
                  }else if (primaryType === "Ctg") {
                    setPrimaryTypeOptions(ctg);
                    tempPrimaryOptions = ctg;
                  } else {
                    setPrimaryTypeOptions(smartBuys);
                    tempPrimaryOptions = smartBuys;
                  }
                  if(selectedPrimaryTypesState.length>0){
                      setSelectedPrimaryTypesState([]);
                  }
                  const gridData = await getGridOptionMapping(primaryType,value,tempPrimaryOptions,useSaleshub);
                  setGridDataMapping(gridData); 
                  setGridDataLoader(false);
                }}
                options={secondaryBucketTypes}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={translate(TranslationEnum.manage_bucket,"Select Bucket Sub-Type")}
                  />
                )}
              />
            </>}
            <BucketGridFields
              useSaleshub={useSaleshub}
              view={hideAllInputs? "partialEdit" : view}
              gridDataLoader={gridDataLoader} 
              gridDataMapping = {gridDataMapping}
              secondaryTypeOptions={secondaryTypeOptions}
              selectedPrimaryTypes={selectedPrimaryTypes}
              setSelectedPrimaryTypes={setSelectedPrimaryTypes}
              setPrimaryTypeOptions={setPrimaryTypeOptions}
              primaryTypeOptions={primaryTypeOptions}
              primaryType={primaryType}
              selectedPrimaryTypesState={selectedPrimaryTypesState as primaryTypeState[]}
              setSelectedPrimaryTypesState={setSelectedPrimaryTypesState as React.Dispatch<React.SetStateAction<primaryTypeState[]>>}
              secondaryType={secondaryType}
            />
          </>
        );
      }
      case "Need Based Basket Banner": {
        return <>
               {!hideAllInputs && <>
                <label className="create-basket-input-labels">
                {translate(TranslationEnum.manage_bucket,"BANNER ICON")}
                </label>
                <UploadImageButton resolution={{ width: 90, height: 90 }} label="Upload Banner Icon" image={bannerIcon} setImage={setBannerIcon} defaultImage={bannerIconBlobKey} setDefaultImage={setBannerIconBlobKey} useSaleshub={useSaleshub} />
               </>}
                {/* <CreateBanner bucketView={view} bucketId={bucketTextFieldData.id} handleBucketDataSubmit={handleBucketSubmit} validateAllBucketInputs={validateAllInputs} /> */}
                <BannerSelection resolution="300 X 420" label="Need Based Basket Banners" bannerTemplates={["template8","template29"]} selectedPrimaryTypesState={selectedPrimaryTypesState as Banner[]} setSelectedPrimaryTypesState={setSelectedPrimaryTypesState as React.Dispatch<React.SetStateAction<Banner[]>>} view={view}/>
               </>
      }
      case "campaignBanner": {
        return <>
                <BannerSelection resolution="210 X 240" label="Campaign Banner" bannerTemplates={["template999"]} selectedPrimaryTypesState={selectedPrimaryTypesState as Banner[]} setSelectedPrimaryTypesState={setSelectedPrimaryTypesState as React.Dispatch<React.SetStateAction<Banner[]>>} view={view}/>
               </>
      }
      case "basketBannerOneClick": {
        return <BannerSelection resolution="1024 X 376" label="Basket Banner One Click" bannerTemplates={["template32"]} selectedPrimaryTypesState={selectedPrimaryTypesState as Banner[]} setSelectedPrimaryTypesState={setSelectedPrimaryTypesState as React.Dispatch<React.SetStateAction<Banner[]>>} view={view}/>
      }
      default: return <></>;
    }
  }

  const validIdValue = (id: string) => {
    return /^[a-zA-Z0-9_]*$/i.test(id)
  }
  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const colour = event.target.value;
    if (colour.length === 0 || !isValidHexColor(colour)) {
      setIsValidColor(false);
    } else {
      setIsValidColor(true);
    }
    setBucketBackgroundColor(colour);
  };
   const handleStaticColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const colour = event.target.value;
    if (colour.length === 0 || !isValidHexColor(colour)) {
      setIsValidColor(false);
    } else {
      setIsValidColor(true);
    }
    setBucketStaticColor(colour);
  };
  const isValidHexColor = (colorString: string) => {
    if (colorString.length < 7) {
      return false;
    }
    return /^#([0-9A-F]{3}){1,2}$/i.test(colorString);
  };
  const renderBackgroundInput = () => {
    if (!bucketBackgroundType) return <></>;
    if (bucketDesign === "campaignBanner")
    return <div style={{marginTop:"15px",display:"flex",flexDirection:"column",gap:"10px"}}>
      BACKGROUND TYPE{" "}
      <TextField
        id="outlined-start-adornment"
        size="small"
        value={bucketBackgroundColor}
        placeholder={"#ffffff"}
        onChange={handleColorChange}
        InputProps={{
          endAdornment: (
            <input
              type="color"
              style={{padding: "0"}}
              id="color-picker"
              value={bucketBackgroundColor}
              onChange={handleColorChange}
            />
          ),
        }}
        error={!isValidColor}
        helperText={!isValidColor && "Please select a valid hex code"}
      /></div>;
    if(bucketDesign==="Carousel" || bucketDesign==="1DGrid" || bucketDesign==="Need Based Basket Banner"){
        switch (bucketBackgroundType) {
            case "Color":
              return (
                <>
                  <TextField
                    id="outlined-start-adornment"
                    size="small"
                    value={bucketBackgroundColor}
                    placeholder={"#ffffff"}
                    onChange={handleColorChange}
                    InputProps={{
                      endAdornment: (
                        <input
                          type="color"
                          id="color-picker"
                          value={bucketBackgroundColor}
                          style={{ width: "60px", padding: "1px" }}
                          onChange={handleColorChange}
                        />
                      ),
                    }}
                    error={!isValidColor}
                    helperText={!isValidColor && "Please select a valid hex code"}
                  />
                </>
              );
            case "Image":
              return (
                <>
                  <UploadImageButton
                    label={"BACKGROUND IMAGE"}
                    setImage={setBucketBackgroundImage}
                    image = {bucketBackgroundImage}
                    defaultImage={bucketBackgroundBlobkey}
                    setDefaultImage={setBucketBackgroundBlobkey}
                    resolution={{
                      width:bucketDesign==="1DGrid" ? 390 : 720,
                      height:bucketDesign==="1DGrid" ? 170 : 600
                    }}
                    useSaleshub={useSaleshub}
                  />
                </>
              );
          }
    }else{
        return <></>;
    }
    
  };
  const idValidationText = () => {
    if(!bucketTextFieldData.id){
      return "Please enter a ID";
    }
    if(view==='create' && !isValidBucketId()){
      return `Bucket with ID: ${bucketTextFieldData.id} already exists`;
    }
    if(!validIdValue(bucketTextFieldData.id)){
      return "ID can only contain alphabets and numbers"
    }
    return "";
  }
  const subtitleValidationText = () => {
    if(bucketTextFieldData.subtitle.length>50){
      return "Subtitle can be of maximum 50 characters";
    }
    return "";
  }
  const titleValidationText = () => {
    if(!bucketTextFieldData.title){
      return "Please enter a title";
    }
    if(bucketTextFieldData.title.trim().length===0){
      return "Title must not be empty spaces"
    }
    if(bucketTextFieldData.title.length>40){
      return "Title can be of maximum of 40 characters";
    }
  }
  
  const isValidBucketId = () => {
    //should check for numeric?
    const allBuckets = bucketConfigurationRef.current[0].value;
    const index = allBuckets.findIndex(
      (bucket: any) => bucket.id === bucketTextFieldData.id
    );
    return index === -1;
  };
  const idHelperText = idValidationText();
  const titleHelperText = titleValidationText();
  const subtitleHelperText = subtitleValidationText();

  const validateAllInputs = () => {
    let message = "";
    if(props.validateAllParentInputs) message = props.validateAllParentInputs();
    if(message!=="") return message;
    let invalidCount = 0;
    // if (idHelperText) {
    //   message = idHelperText;
    //   invalidCount++;
    // }
    if (invalidCount < 2 && titleHelperText && bucketDesign!="1DGrid") {
      message = titleHelperText;
      invalidCount++;
    }
    if (invalidCount < 2 && subtitleHelperText && bucketDesign!="1DGrid") {
      message = subtitleHelperText;
      invalidCount++;
    }
    if (invalidCount < 2 && (bucketDesign==="Carousel"  || bucketDesign==="1DGrid") && !bucketBackgroundType) {
      message = "Please select a valid background type";
      invalidCount++;
    }
    if(!useBeta && invalidCount < 2 && blockSelectionState.blockConfigEnabled && !blockSelectionState.selectedBlock.id){
      message = "Please select a block";
      invalidCount++;
    }
    if (
      invalidCount < 2 &&
      (bucketDesign==="Carousel" || bucketDesign==="1DGrid" || bucketDesign==="Need Based Basket Banner") &&
      bucketBackgroundType === "Image" &&
      !bucketBackgroundImage &&
      !bucketBackgroundBlobkey
    ) {
      message = "Please select a valid background Image";
      invalidCount++;
    } else if (
      invalidCount < 2 && 
      (bucketDesign==="Carousel" || bucketDesign==="1DGrid" || bucketDesign==="Need Based Basket Banner") &&
      bucketBackgroundType === "Color" &&
      !isValidColor
    ) {
      message = "Please select a valid background color";
      invalidCount++;
    }
    const isBannerTypeBucket = ["Need Based Basket Banner","basketBannerOneClick","campaignBanner"].includes(bucketDesign);
    if (invalidCount < 2 && !isBannerTypeBucket && !primaryType) {
      message = "Please select a Bucket Type";
      invalidCount++;
    }
    if (bucketDesign === "Carousel"  || bucketDesign==="1DGrid") {
      if (invalidCount < 1 && selectedPrimaryTypesState.length === 0) {
        message = "Please select and add atleast one " + primaryType;
        invalidCount++;
      } else if (invalidCount < 1 && selectedPrimaryTypesState.length > 0) {
        let carouselImageInvalidCount = 0;
        for (let num = 0; num < selectedPrimaryTypesState.length; num++) {
          if (selectedPrimaryTypesState[num]) {
            const caraouselItem = selectedPrimaryTypesState[num] as primaryTypeState;
            if (
                carouselImageInvalidCount < 1 &&
              (!caraouselItem.inputRef || !caraouselItem.inputRef.files?.[0]) &&
              !caraouselItem.blobKey
            ) {
              message = "Please add images for all Grid items, or remove unnecessary items"; 
              carouselImageInvalidCount++;
            }
            else if(carouselImageInvalidCount>1){
                break;
            }
          }
        }
      }
    } else if (bucketDesign === "Grid") {
      if (invalidCount < 1 && !secondaryType) {
        message = "Please select a Bucket Sub-Type";
      }
      if (invalidCount < 1 && selectedPrimaryTypesState.length === 0) {
        message = "Please select and add atleast one " + primaryType;
        invalidCount++;
      }
      let gridImageInvalidCount = 0;
      for(let pIdx=0;pIdx<selectedPrimaryTypesState.length;pIdx++){
        const primaryItem = selectedPrimaryTypesState[pIdx] as primaryTypeState;
        if(gridImageInvalidCount<1 && (!primaryItem.inputRef || !primaryItem.inputRef.files?.[0]) && !primaryItem.blobKey){
            message = "Please add images for all 2D Grid items, or remove unnecessary items";
            gridImageInvalidCount++;
        }else if(gridImageInvalidCount>1){
            break;
        }
        if(primaryItem.secondaryTypeOptions){
            const secondaryItems = primaryItem.secondaryTypeOptions;
            for(let sIdx=0;sIdx<secondaryItems.length;sIdx++){
                const secondaryItem = secondaryItems[sIdx];
                if(gridImageInvalidCount<1 && (!secondaryItem.inputRef || !secondaryItem.inputRef.files?.[0]) && !secondaryItem.blobKey){
                    message = "Please add images for all 2D Grid items, or remove unnecessary items";
                    gridImageInvalidCount++;
                }else if(gridImageInvalidCount>1){
                    break;
                }
            }
        }
      }
    }else if(bucketDesign==="Need Based Basket Banner"){
        
    }
    if (invalidCount < 2 && bucketDesign === "campaignBanner") {
      if (campaignBannerType === "GIF") {
        if (!bucketGIFImage && !bucketBackgroundGIF) {
          message = "Please upload GIF";
          invalidCount++;
        }
      } else if (campaignBannerType === "TOGGLE") {
        if (!toggleItems || toggleItems.length === 0) {
          message = "Please add at least one toggle combination";
          invalidCount++;
        } else {
          // validate each item has either URL or file for both fields
          for (let i = 0; i < toggleItems.length; i++) {
            const it = toggleItems[i];
            const hasBackground = Boolean(it.backgroundUrl && it.backgroundUrl.trim()) || Boolean(it.backgroundFile);
            const hasToggle = Boolean(it.toggleUrl && it.toggleUrl.trim()) || Boolean(it.toggleFile);
            if (!hasBackground || !hasToggle) {
              message = "Please add both background and toggle images/URLs for all combinations";
              invalidCount++;
              break;
            }
          }
        }
      }
    }
    return invalidCount < 2
      ? message
      : "Multiple Fields are invalid, please fill all the required fields to continue";
  };
  const handleBucketSubmit = async (innerComponentData?: bucketInnerComponent | blockInnerComponent,verifiedUser?: manageUpdateAccessObj) => {
    try {
      setShowSubmitLoader(true);
      if(!innerComponentData){
        const validationMessage = validateAllInputs();
        if (validationMessage !== "") {
          setPopupMessage(validationMessage);
          setPopupType("Alert");
          setOpenGenericModal(true);
          setShowSubmitLoader(false);
          return;
        }
      }
      if(bucketDesign==="campaignBanner"){
        if (!startDate || !endDate) {
          openPopup("Error", "Please input start date and end date")
          setShowSubmitLoader(false);
          return;
        }
        if (dateValidation.startDate || !startDate?.isValid()) {
          openPopup("Error", "Please input correct start date")
          setShowSubmitLoader(false);
          return;
        }
        if (dateValidation.endDate || !endDate?.isValid()) {
          openPopup("Error", "Please input correct end date")
          setShowSubmitLoader(false);
          return;
        }
        if(!bucketGIFImage && !bucketBackgroundGIF && campaignBannerType === "GIF"){
          openPopup("Error", "Please upload GIF")
          setShowSubmitLoader(false);
          return;

        }
        if (!togglePosition && campaignBannerType === "TOGGLE") {
          openPopup("Error", "Please select toggle position")
          setShowSubmitLoader(false);
          return;
        }
      }
      //creating form data for all images
      let imagesPayload = new FormData();

      const allBuckets = bucketConfigurationRef.current[0].value as any[];
      let newAllBuckets = [...allBuckets];
      const bucketConfiguration = [...bucketConfigurationRef.current];
      const trimmedTextFieldData: bucketTextFieldDataState = {
        id: (view==="create" && !currentBucketLocationData)? new Date().getTime().toString() : currentBucketLocationData.id ,
        title: bucketTextFieldData.title.trim(),
        subtitle: bucketTextFieldData.subtitle.trim(),
      }
      if (bucketDesign === "Carousel" || bucketDesign==="1DGrid") {
        if (bucketBackgroundType === "Image" && bucketBackgroundImage) {
            imagesPayload.append("files", bucketBackgroundImage);
        }
        for (let num = 0; num < selectedPrimaryTypesState.length; num++) {
          const caraouselItem = selectedPrimaryTypesState[num] as primaryTypeState;
          if (caraouselItem.inputRef?.files?.[0])
            imagesPayload.append("files", caraouselItem.inputRef?.files?.[0]);
        }
        const blobUrls = imagesPayload.has("files")
          ? (useSaleshub
              ? await uploadDocumentsToSalescode(imagesPayload)
              : await uploadImages(imagesPayload))
          : [];
        if (!Array.isArray(blobUrls)) {
          setOpenGenericModal(true);
          setPopupMessage(blobUrls.message);
          setPopupType("Error");
          setShowSubmitLoader(false);
          return;
        }
        let blobIdx = 0;
        let backgroundBlobKey = "";
        if (bucketBackgroundType === "Image" && bucketBackgroundImage) {
          backgroundBlobKey = blobUrls[0];
          blobIdx++;
        }
        const primarySourceOptions = (selectedPrimaryTypesState as primaryTypeState[]).map(
          (carouselItem: primaryTypeState) => {
            return {
              id: carouselItem.id,
              name: carouselItem.value,
              blobKey: carouselItem.blobKey || blobUrls[blobIdx++],
            };
          }
        );
        if ((primarySourceOptions.length < 4 || primarySourceOptions.length > 15) && bucketDesign === "1DGrid") {
          setShowSubmitLoader(false);
          setOpenGenericModal(true);
          if (primarySourceOptions.length < 4) {
            setPopupMessage(`You need to select a minimum of 4 ${primaryType.toLowerCase()} to proceed`);
          } else {
            setPopupMessage("Limit exceeded — you can select up to 15 categories only");
          }
          setPopupType("Error");
          return;
        }
        const newBucketPayload: any = {
          ...trimmedTextFieldData,
          titleColor: !titleColorToggle? "#000000" : "#ffffff",
          subTitleColor: !subtitleColorToggle? "#000000" : "#ffffff",
          bucketDesign,
          primarySource: primaryType==="Pack Size"? "pieceSize" : primaryType==="Piece Size Description"? "pieceSizeDesc" : primaryType,
          statusEnabled: true,
          primarySourceOptions,
          viewAll,
          sticky,
          minBoxes,
          bucketStaticColor: bucketStaticColor,
          ...((bucketDesign === "Carousel" && companyGridConfig) ? { displayCompanyBucket: true } : {}),
          ...(bucketDesign === "Carousel" ? { selectedDimension } : {}), // <-- add selectedDimension for Carousel
        };
        if (bucketDesign === "1DGrid") {
          newBucketPayload.allSvgPath = "https://d2nvw4ekms3xzy.cloudfront.net/ckcoeuat/images/All (1)-HPvfXpYrmAMg.svg";
        }
        if ((backgroundBlobKey || bucketBackgroundBlobkey)) {
          newBucketPayload["backgroundBlobKey"] =
            backgroundBlobKey || bucketBackgroundBlobkey;
        } else{
          newBucketPayload["backgroundColor"] = bucketBackgroundColor;
        }

        if (view === "create")
          newAllBuckets = [...allBuckets, newBucketPayload];
        else if (view === "edit") {
          const bucketIdx = allBuckets.findIndex(
            (bucket) => bucket.id === bucketTextFieldData.id
          );
          newAllBuckets[bucketIdx] = newBucketPayload;
        }
      }else if (bucketDesign === "Grid") {
        for (
          let primaryIdx = 0;
          primaryIdx < selectedPrimaryTypesState.length;
          primaryIdx++
        ) {
          const primaryTypeOption = selectedPrimaryTypesState[primaryIdx] as primaryTypeState;
          if (primaryTypeOption.inputRef?.files?.[0]) {
            imagesPayload.append("files", primaryTypeOption.inputRef.files[0]);
          }
          const secondaryTypeOptions = primaryTypeOption.secondaryTypeOptions;
          if (secondaryTypeOptions) {
            for (
              let secondaryIdx = 0;
              secondaryIdx < secondaryTypeOptions.length;
              secondaryIdx++
            ) {
              const secondaryTypeOption = secondaryTypeOptions[secondaryIdx];
              if (secondaryTypeOption.inputRef?.files?.[0]) {
                imagesPayload.append(
                  "files",
                  secondaryTypeOption.inputRef.files[0]
                );
              }
            }
          }
        }
        const blobUrls = imagesPayload.has("files")
          ? (useSaleshub
              ? await uploadDocumentsToSalescode(imagesPayload)
              : await uploadImages(imagesPayload))
          : [];
        if (!Array.isArray(blobUrls)) {
          setOpenGenericModal(true);
          setPopupMessage(blobUrls.message);
          setPopupType("Error");
          setShowSubmitLoader(false);
          return;
        }
        let blobIdx = 0;
        const primarySourceOptions = (selectedPrimaryTypesState as primaryTypeState[]).map(
          (gridItem: primaryTypeState) => {
            return {
              id: gridItem.id,
              name: gridItem.value,
              blobKey: gridItem.inputRef?.files?.[0]
                ? blobUrls[blobIdx++]
                : gridItem.blobKey,
              activeStatus: gridItem.activeStatus,
              color: gridItem.color,
              secondarySourceOptions: gridItem.secondaryTypeOptions!.map(
                (gridSecondaryItem: secondaryTypesState) => {
                  return {
                    id: gridSecondaryItem.id,
                    name: gridSecondaryItem.value,
                    blobKey: gridSecondaryItem.inputRef?.files?.[0]
                      ? blobUrls[blobIdx++]
                      : gridSecondaryItem.blobKey,
                  };
                }
              ),
            };
          }
        );
        const newBucketPayload: any = {
          ...trimmedTextFieldData,
          titleColor: !titleColorToggle? "#000000" : "#ffffff",
          subTitleColor: !subtitleColorToggle? "#000000" : "#ffffff",
          bucketDesign,
          primarySource: primaryType==="Pack Size"? "pieceSize" : primaryType==="Piece Size Description"? "pieceSizeDesc" : primaryType,
          secondarySource: secondaryType==="Pack Size"? "pieceSize" :secondaryType==="Piece Size Description"? "pieceSizeDesc": secondaryType,
          statusEnabled: true,
          primarySourceOptions,
          viewAll,
          ...(companyGridConfig ? { displayCompanyBucket: true } : {}),
        };

        if (view === "create")
          newAllBuckets = [...allBuckets, newBucketPayload];
        else if (view === "edit") {
          const bucketIdx = allBuckets.findIndex(
            (bucket) => bucket.id === bucketTextFieldData.id
          );
          newAllBuckets[bucketIdx] = newBucketPayload;
        }
      }else if(bucketDesign==="Need Based Basket Banner"){
        if (bucketBackgroundType === "Image" && bucketBackgroundImage) {
          imagesPayload.append("files", bucketBackgroundImage);
        }
        if(bannerIcon && !bannerIconBlobKey){
          imagesPayload.append("files", bannerIcon);
        }
        const blobUrls = imagesPayload.has("files")
          ? (useSaleshub
              ? await uploadDocumentsToSalescode(imagesPayload)
              : await uploadImages(imagesPayload))
          : [];
        if (!Array.isArray(blobUrls)) {
          setOpenGenericModal(true);
          setPopupMessage(blobUrls.message);
          setPopupType("Error");
          setShowSubmitLoader(false);
          return;
        }
        let blobIdx = 0;
        let backgroundBlobKey = "";
        if (bucketBackgroundType === "Image" && bucketBackgroundImage) {
          backgroundBlobKey = blobUrls[0];
          blobIdx++;
        }
        const bannerIds = (selectedPrimaryTypesState as Banner[]).map((bannerObj: Banner) => {
          return bannerObj.id;
        })
        const newBucketPayload: any = {
          ...trimmedTextFieldData,
          titleColor: !titleColorToggle? "#000000" : "#ffffff",
          subTitleColor: !subtitleColorToggle? "#000000" : "#ffffff",
          bucketDesign,
          bannerIconBlobKey: bannerIconBlobKey || blobUrls[blobIdx],
          bannerId: bannerIds.length>0? bannerIds[0] : "", //for handling previous flow
          bannerIds,
          statusEnabled: true,
          viewAll,
          ...(companyGridConfig ? { digivyaparBanner: "true" } : {}),
        };
        if ((backgroundBlobKey || bucketBackgroundBlobkey)) {
          newBucketPayload["backgroundBlobKey"] =
            backgroundBlobKey || bucketBackgroundBlobkey;
        } else{
          newBucketPayload["backgroundColor"] = bucketBackgroundColor;
        }
        if (view === "create")
          newAllBuckets = [...allBuckets, newBucketPayload];
        else if (view === "edit") {
          const bucketIdx = allBuckets.findIndex(
            (bucket) => bucket.id === bucketTextFieldData.id
          );
          newAllBuckets[bucketIdx] = newBucketPayload;
        }
      }else if(bucketDesign === "basketBannerOneClick"){
        const bannerIds = (selectedPrimaryTypesState as Banner[]).map((bannerObj: Banner) => {
          return bannerObj.id;
        })
        const newBucketPayload: any = {
          ...trimmedTextFieldData,
          titleColor: !titleColorToggle? "#000000" : "#ffffff",
          subTitleColor: !subtitleColorToggle? "#000000" : "#ffffff",
          bucketDesign,
          bannerIds,
          statusEnabled: true,
          viewAll
        };
        if (view === "create")
          newAllBuckets = [...allBuckets, newBucketPayload];
        else if (view === "edit") {
          const bucketIdx = allBuckets.findIndex(
            (bucket) => bucket.id === bucketTextFieldData.id
          );
          newAllBuckets[bucketIdx] = newBucketPayload;
        }
      }else if(bucketDesign==="campaignBanner"){
        if (campaignBannerType === "GIF") {
                    if (bucketGIFImage) {
                        imagesPayload.append("files", bucketGIFImage);
                    }
                    if (bannerIcon && !bannerIconBlobKey) {
                        imagesPayload.append("files", bannerIcon);
                    }
                } else if (campaignBannerType === "TOGGLE") {
                    // for toggle items, append any new files in sequence
                    // We will append backgroundFile and toggleFile for each item in order
                    for (let i = 0; i < toggleItems.length; i++) {
                        const it = toggleItems[i];
                        if (it.backgroundFile) {
                            imagesPayload.append("files", it.backgroundFile);
                        }
                        if (it.toggleFile) {
                            imagesPayload.append("files", it.toggleFile);
                        }
                    }
                    // bannerIcon if new
                    if (bannerIcon && !bannerIconBlobKey) {
                        imagesPayload.append("files", bannerIcon);
                    }
                }
        
        if (bucketBackgroundType === "Image" && bucketBackgroundImage) {
          imagesPayload.append("files", bucketBackgroundImage);
        }
        if(bucketGIFImage){
          imagesPayload.append("files", bucketGIFImage);
        }
        if(bannerIcon && !bannerIconBlobKey){
          imagesPayload.append("files", bannerIcon);
        }
        const blobUrls = imagesPayload.has("files")
          ? (useSaleshub
              ? await uploadDocumentsToSalescode(imagesPayload)
              : await uploadImages(imagesPayload))
          : [];
        if (!Array.isArray(blobUrls)) {
          setOpenGenericModal(true);
          setPopupMessage(blobUrls.message);
          setPopupType("Error");
          setShowSubmitLoader(false);
          return;
        }
        let blobIdx = 0; 
        let backgroundBlobKey = "";
        let backgroundGIFBlobKey = "";
        if (bucketBackgroundType === "Image" && bucketBackgroundImage) {
          backgroundBlobKey = blobUrls[0];
          blobIdx++;
        }
        if (campaignBannerType === "GIF") {
          if (bucketGIFImage) {
            backgroundGIFBlobKey = blobUrls[blobIdx++];
          }
        }
        let itemsArray: { backgroundUrl: string; toggleUrl: string }[] = [];
        if (campaignBannerType === "TOGGLE") {
          let tempBlobIdx = 0;
          tempBlobIdx = blobIdx - (bannerIcon && !bannerIconBlobKey ? 1 : 0); // starting point for the toggle files in blobUrls array
          let mapIdx = 0;
          mapIdx = (bucketBackgroundType === "Image" && bucketBackgroundImage) ? 1 : 0;
          const constructedItems: { backgroundUrl: string; toggleUrl: string }[] = [];
          for (let i = 0; i < toggleItems.length; i++) {
            const it = toggleItems[i];
            let resolvedBackgroundUrl = it.backgroundUrl || "";
            let resolvedToggleUrl = it.toggleUrl || "";
            if (it.backgroundFile) {
              resolvedBackgroundUrl = blobUrls[mapIdx++];
            }
            if (it.toggleFile) {
              resolvedToggleUrl = blobUrls[mapIdx++];
            }
            constructedItems.push({
              backgroundUrl: resolvedBackgroundUrl,
              toggleUrl: resolvedToggleUrl,
            });
          }
          itemsArray = constructedItems;
          // After this, banner icon blob (if any) will be at blobUrls[mapIdx] but we handled bannerIcon earlier using resolvedBannerIconBlob logic
        }
        if (bucketGIFImage) {
          backgroundGIFBlobKey = blobUrls[blobIdx];
          blobIdx++;
        }
        const bannerIds = (selectedPrimaryTypesState as Banner[]).map((bannerObj: Banner) => {
          return bannerObj.id;
        })
        const newBucketPayload: any = {
          ...trimmedTextFieldData,
          titleColor: !titleColorToggle? "#000000" : "#ffffff",
          subTitleColor: !subtitleColorToggle? "#000000" : "#ffffff",
          bucketDesign,
          bannerIconBlobKey: bannerIconBlobKey || blobUrls[blobIdx],
          bannerId: bannerIds.length>0? bannerIds[0] : "", //for handling previous flow
          bannerIds,
          statusEnabled: true,
          startDate:startDate?.format("YYYY-MM-DD") + " 00:00:00",
          endDate:endDate?.format("YYYY-MM-DD") + " 23:59:59",
          ...(campaignBannerType === "TOGGLE" && { togglePosition }),
        };
        // console.log("newBucketPayload",newBucketPayload)
        
        if ((backgroundBlobKey || bucketBackgroundBlobkey)) {
          newBucketPayload["backgroundBlobKey"] =
            backgroundBlobKey || bucketBackgroundBlobkey;
        } else{
          newBucketPayload["backgroundColor"] = bucketBackgroundColor;
        }
        
        if(backgroundGIFBlobKey || bucketBackgroundGIF){
          newBucketPayload["backgroundGIFBlobKey"] = backgroundGIFBlobKey || bucketBackgroundGIF;
        }
        if (campaignBannerType === "GIF") {
          if (backgroundGIFBlobKey || bucketBackgroundGIF) {
            newBucketPayload["backgroundGIFBlobKey"] = backgroundGIFBlobKey || bucketBackgroundGIF;
          }
        } else if (campaignBannerType === "TOGGLE") {
          newBucketPayload["items"] = itemsArray;
        }
        if (view === "create")
          newAllBuckets = [...allBuckets, newBucketPayload];
        else if (view === "edit") {
          const bucketIdx = allBuckets.findIndex(
            (bucket) => bucket.id === bucketTextFieldData.id
          );
          newAllBuckets[bucketIdx] = newBucketPayload;
        }
      }
      bucketConfiguration[0].value = newAllBuckets;
      
      if (saleshubPostAPI) {
        try {
          const currentBucket =
            view === "create"
              ? newAllBuckets[newAllBuckets.length - 1]
              : newAllBuckets.find(
                  (b: any) => b.id === bucketTextFieldData.id
                );
          const saleshubPayload = transformBucketToSaleshubPayload(currentBucket);
          
          if (view === "create") {
            const saleshubResponse = await axios.post(
              "https://api.salescodeai.com/baskets",
              saleshubPayload,
              {
                headers: {
                  Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                  "Content-Type": "application/json",
                  "x-tenant-id": getLob(),
                },
              }
            );

            if (saleshubResponse.status >= 200 && saleshubResponse.status < 300) {
              const saleshubId = saleshubResponse.data?.id;
              if (saleshubId) {
                // Update the bucket with saleshubId
                const bucketIdx = newAllBuckets.findIndex(b => b.id === currentBucket.id);
                if (bucketIdx !== -1) {
                  newAllBuckets[bucketIdx].saleshubId = saleshubId;
                  bucketConfiguration[0].value = newAllBuckets;
                }
              }
            } else {
              openPopup("Error","Failed to create bucket in Saleshub");
            }
          } else if (view === "edit") {
            const existingSaleshubId = currentBucketLocationData?.saleshubId;
            
            if (existingSaleshubId) {
              try {
                const saleshubResponse = await axios.put(
                  `https://api.salescodeai.com/baskets/${existingSaleshubId}`,
                  saleshubPayload,
                  {
                    headers: {
                      Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                      "Content-Type": "application/json",
                      "x-tenant-id": getLob(),
                    },
                  }
                );

                if (saleshubResponse.status >= 200 && saleshubResponse.status < 300) {
                  const saleshubId = saleshubResponse.data?.id || existingSaleshubId;
                  const bucketIdx = newAllBuckets.findIndex(b => b.id === currentBucket.id);
                  if (bucketIdx !== -1 && saleshubId) {
                    newAllBuckets[bucketIdx].saleshubId = saleshubId;
                    bucketConfiguration[0].value = newAllBuckets;
                  }
                } else {
                  const bucketExistsInS3 = currentBucket.id && currentBucketLocationData; 
                  if (bucketExistsInS3) {
                    try {
                      const createResponse = await axios.post(
                        "https://api.salescodeai.com/baskets",
                        saleshubPayload,
                        {
                          headers: {
                            Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                            "Content-Type": "application/json",
                            "x-tenant-id": getLob(),
                          },
                        }
                      );

                      if (createResponse.status >= 200 && createResponse.status < 300) {
                        const saleshubId = createResponse.data?.id;
                        if (saleshubId) {
                          const bucketIdx = newAllBuckets.findIndex(b => b.id === currentBucket.id);
                          if (bucketIdx !== -1) {
                            newAllBuckets[bucketIdx].saleshubId = saleshubId;
                            bucketConfiguration[0].value = newAllBuckets;
                          }
                        }
                      } else {
                        openPopup("Error","Failed to create bucket in Saleshub after PUT failed");
                      }
                    } catch (createError) {
                      openPopup("Error","Failed to create bucket in Saleshub after PUT failed");
                    }
                  } else {
                    openPopup("Error","Failed to update bucket in Saleshub");
                  }
                }
              } catch (putError: any) {
                const bucketExistsInS3 = currentBucket.id && currentBucketLocationData; 
                if (bucketExistsInS3) {
                  try {
                    const createResponse = await axios.post(
                      "https://api.salescodeai.com/baskets",
                      saleshubPayload,
                      {
                        headers: {
                          Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                          "Content-Type": "application/json",
                          "x-tenant-id": getLob(),
                        },
                      }
                    );

                    if (createResponse.status >= 200 && createResponse.status < 300) {
                      const saleshubId = createResponse.data?.id;
                      if (saleshubId) {
                        const bucketIdx = newAllBuckets.findIndex(b => b.id === currentBucket.id);
                        if (bucketIdx !== -1) {
                          newAllBuckets[bucketIdx].saleshubId = saleshubId;
                          bucketConfiguration[0].value = newAllBuckets;
                        }
                      }
                    } else {
                      openPopup("Error","Failed to create bucket in Saleshub after PUT error");
                    }
                  } catch (createError) {
                    openPopup("Error","Failed to create bucket in Saleshub after PUT error");
                  }
                } else {
                  openPopup("Error","Failed to update bucket in Saleshub");
                }
              }
            } else {
              const saleshubResponse = await axios.post(
                "https://api.salescodeai.com/baskets",
                saleshubPayload,
                {
                  headers: {
                    Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                    "Content-Type": "application/json",
                    "x-tenant-id": getLob(),
                  },
                }
              );

              if (saleshubResponse.status >= 200 && saleshubResponse.status < 300) {
                const saleshubId = saleshubResponse.data?.id;
                if (saleshubId) {
                  const bucketIdx = newAllBuckets.findIndex(b => b.id === currentBucket.id);
                  if (bucketIdx !== -1) {
                    newAllBuckets[bucketIdx].saleshubId = saleshubId;
                    bucketConfiguration[0].value = newAllBuckets;
                  }
                }
              } else {
                openPopup("Error","Failed to create bucket in Saleshub");
              }
            }
          }
        } catch (saleshubError) {
          openPopup("Error","Failed to create bucket in Saleshub");
        }
      }
      
      const finalMetaDataPayload: metaDataBatchPayload = { features: [] };
      let bucketPayload = {
        domainName: "clientconfig",
        domainType: "bucket_configuration",
        domainValues: bucketConfiguration ,
        lob: getLob()
      };
      finalMetaDataPayload.features.push(bucketPayload);
      if(blockSelectionState.isChanged && blockSelectionState.blockConfigEnabled && blockSelectionState.selectedBlock.id){
        const blockPayload = getBlockMetaData(savedRole?.id,trimmedTextFieldData.id,blockSelectionState.selectedBlock,clientConfigRef.current);
        if(blockPayload){
          finalMetaDataPayload.features.push(blockPayload);
        }
        const wholeSellerLayoutConfig = getClientConfigDomainType(clientConfigRef.current,"wholesaler_app_layout_configuration");
        if(wholeSellerLayoutConfig && wholeSellerConfig){
            const role = "retailer";
            const configName = `${role}_app_layout_configuration`;
            const roleAppLayoutConfig = getClientConfigDomainType(clientConfigRef.current,configName);
            const updatedRoleLayoutConfig = getUpdatedRoleAppLayoutConfig(roleAppLayoutConfig,blockSelectionState.selectedBlock,trimmedTextFieldData.id);
            const wholeSellerConfigData = await getWholeSellerConfiguration(clientConfigRef.current,updatedRoleLayoutConfig);
            if(wholeSellerConfigData && wholeSellerConfig){
              finalMetaDataPayload.features.push(wholeSellerConfigData);
            }
        }
      }
      try {
        const response = await axios.post(
          "https://salescode-marketplace.salescode.ai/configuration/update",
          finalMetaDataPayload,
          {
            headers: {
              lob: getLob(),
              "Content-Type": "application/json",
            },
          }
        );

        setShowSubmitLoader(false);

        if (response.status >= 200 && response.status < 300) {
          // const validationObj = validateMetaDataResponse(response?.data?.features);
          // if (validationObj.success) {
          //   setPopupMessage(
          //     `Bucket with ID: ${bucketTextFieldData.id} ${view==="create"?"created": "updated"} successfully`
          //   );
          //   setPopupType("Success");
          // } else {
          //   setPopupMessage(validationObj.message);
          //   setPopupType("Error");
          // }
          setPopupMessage(
            `Bucket with ID: ${bucketTextFieldData.id} ${view==="create"?"created": "updated"} successfully`
          );
          setPopupType("Success");
          setOpenGenericModal(true);
        } else {
          setPopupMessage(`Something went wrong while creating bucket, Please try again`);
          setPopupType("Error");
          setOpenGenericModal(true);
        }
      } catch (err) {
        console.error("Failed to update bucket configuration via S3 API:", err);
        setShowSubmitLoader(false);
        setPopupMessage(`Something went wrong while creating bucket, Please try again`);
        setPopupType("Error");
        setOpenGenericModal(true);
      }

      // Old OTP + metadata batch flow (kept for reference)
      // validateWithOtp((verifiedOTPUser?: manageUpdateAccessObj,verifyResponse?: any)=>{
      //   doFinalSubmit(verifiedOTPUser,verifyResponse);
      // },undefined,"all",META_DATA_BATCH_API,finalMetaDataPayload,"PUT")
      
    } catch (err) {
      setShowSubmitLoader(false);
      setPopupMessage(`Something went wrong while creating bucket, Please try again`);
      setPopupType("Error");
      setOpenGenericModal(true);
    }
  }

  const doFinalSubmit=async (verifiedUser?: manageUpdateAccessObj,verifyResponse?: any)=>{
    if (verifyResponse.status === 200 || verifyResponse.status === 201) {
      const validationObj = validateMetaDataResponse(verifyResponse?.data?.features);
      if(validationObj.success){
        setPopupMessage(
          `Bucket with ID: ${bucketTextFieldData.id} ${view==="create"?"created": "updated"} successfully`
        );
        setShowSubmitLoader(false);
        setPopupType("Success");
        setOpenGenericModal(true);
      }else{
        setPopupMessage(
          validationObj.message
        );
        setShowSubmitLoader(false);
        setPopupType("Error");
        
      }
      setOpenGenericModal(true);
    } else {
      throw new Error();
    }
  }
  function renderHeaderName(){
    if(view==="create"){
      return  translate(TranslationEnum.manage_bucket,"Create Bucket");
    }else if(view==="edit"){
      const bucketDesignLabel = bucketDesigns.find((option) => option.id === currentBucketLocationData.bucketDesign)?.label;
      if(hideAllInputs){
        return primaryType? translate(TranslationEnum.manage_bucket,"Manage {primaryType} {bucketDesignLabel}",{"primaryType":primaryType,"bucketDesignLabel":bucketDesignLabel ?? ""}): translate(TranslationEnum.manage_bucket,"Manage {bucketDesignLabel}",{"bucketDesignLabel":bucketDesignLabel?? ""});
      }else{
        return translate(TranslationEnum.manage_bucket,"Edit {primarySource} {bucketDesignLabel}",{"primarySource":currentBucketLocationData.primarySource? currentBucketLocationData.primarySource: "Bucket","bucketDesignLabel":bucketDesignLabel ?? ""});
      }
    }
    return "";
  }
  const addToggleItem = () => {
    if (toggleItems.length < 5) {
      setToggleItems([
        ...toggleItems,
        { backgroundUrl: "", toggleUrl: "", backgroundFile: null, toggleFile: null, id: `item-${Date.now()}` }
      ]);
    }
  };
  const removeToggleItem = (index: number) => {
    if (toggleItems.length > 2) {
      const updated = toggleItems.filter((_, i) => i !== index);
      setToggleItems(updated);
    }
  };
  const updateToggleItem = (index: number, data: Partial<typeof toggleItems[number]>) => {
        setToggleItems(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...data };
            return copy;
        });
    };
  return (
    <div className="create-bucket-parent">
      {!showLoader?<>
        <div className="create-bucket-label">
          <span>{renderHeaderName()}</span>
          <div className='edit-bucket-header-buttons-container'>
              {hideAllInputs && <button
                  className="create-bucket-label-back-button create-bucket-secondary-color"
                  onClick={() => {
                    setHideAllInputs(false);
                  }}
              >
                 {translate(TranslationEnum.common_portal,"EDIT")}
              </button>}
              <BackButton/>
            </div>
        </div>
        <div className="create-basket-input-fields">
          
          {!hideAllInputs && <>
            {view === "edit" && <>
            <label className="create-basket-input-labels">{translate(TranslationEnum.manage_bucket,"ENTER ID")}</label>
            <TextField
              id="outlined-start-adornment"
              size="small"
              value={bucketTextFieldData.id}
              disabled={view==="edit"}
              placeholder={translate(TranslationEnum.manage_bucket,"Enter Id")}
              onChange={(event) => {
                const value = event.target.value;
                if(!bucketTextFieldFlag.id) setBucketTextFieldFlag({...bucketTextFieldFlag, id: true});
                setBucketTextFieldData({ ...bucketTextFieldData, id: value });
              }}
              error = {bucketTextFieldFlag.id && Boolean(idHelperText)}
              helperText = {bucketTextFieldFlag.id && idHelperText}
          /></>}
          <label className="create-basket-input-labels">{translate(TranslationEnum.manage_bucket,"BUCKET DESIGN")}</label>
            <Autocomplete
            disableClearable
            sx={{ width: "100%" }}
            disabled={view==="edit" || locationState?.blockData}
            onChange={(event, value: { id: string, label: string }) => {
              setBucketDesignOption(value);
              setBucketDesign(value.id);
              setSelectedPrimaryTypesState([]);
              setPrimaryType("");
              setPrimaryTypeOptions([]);
              setSecondaryType("");
              if(blockSelectionState.blockConfigEnabled){
                const availableBlockOptions = getAvailableBlockOptionsOfType("Bucket",allBlocksRef.current,value.id)
                if(blockSelectionState.blockConfigEnabled && blockSelectionState.selectedBlock && view==="create") setBlockSelectionState((prevState) => {
                  return { ...prevState, selectedBlock: defaultBlockObj}
                })
                setBlockSelectionState({
                  ...blockSelectionState,
                  blockOptions: availableBlockOptions
                })
              }
              if(selectedPrimaryTypes.length) setSelectedPrimaryTypes([]);
              if(secondaryBucketTypes.length>0) setSecondaryBucketTypes([]);
              if(gridDataMapping.length>0) setGridDataMapping([]);
              if(value.id==="Grid" || value.id ==="Carousel" || value.id ==="1DGrid"){
                  if(bucketBackgroundImage) setBucketBackgroundImage(null);
                  if(bucketBackgroundColor) setBucketBackgroundColor("#ffffff");
                  // if(bucketStaticColor) setBucketStaticColor("#ffffff");
                  if(bucketBackgroundBlobkey) setBucketBackgroundBlobkey("")
                  if(bucketBackgroundType==="Image") setBucketBackgroundType("Color");
              }
              if (value.id === "1DGrid" && !allowed1DGrid) {
                openPopup("Error", "You can create only one carousel");
                setBucketDesign("");
                setBucketDesignOption({
                  label: "",
                  id: ""
                });
                return;
              }
            }}
            value={bucketDesignOption}
            options={bucketDesigns}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={translate(TranslationEnum.manage_bucket,"Select Bucket Design")}
              />
            )}
          />
          {(bucketDesign && bucketDesign!=="1DGrid" )&& <>
          <label className="create-basket-input-labels">{translate(TranslationEnum.manage_bucket,"BUCKET TITLE")}</label>
          <TextField
            id="outlined-start-adornment"
            size="small"
            value={bucketTextFieldData.title}
            placeholder={translate(TranslationEnum.manage_bucket,"Enter Bucket Title")}
            onChange={(event) => {
              const value = event.target.value;
              if(!bucketTextFieldFlag.title) setBucketTextFieldFlag({...bucketTextFieldFlag, title: true});
              setBucketTextFieldData({ ...bucketTextFieldData, title: value });
            }}
            error = { bucketTextFieldFlag.title && Boolean(titleHelperText) }
            helperText = { bucketTextFieldFlag.title && titleHelperText }
          />
          <div className="create-basket-input-labels">
              <span>{translate(TranslationEnum.manage_bucket,"TITLE COLOR")}</span>
              <Switch
                onChange={() => {
                  // setTitleColor(!titleColor);
                  setTitleColorToggle(!titleColorToggle);
                }}
                checked={titleColorToggle}
                offColor="#000000"
                onColor="#ffffff"
                onHandleColor="#000000"
                offHandleColor="#ffffff"
                size={22}
                handleDiameter={19}
                uncheckedIcon={
                  <>
                    <div className="create-checked-color-status">{translate(TranslationEnum.manage_bucket,"BLACK")}</div>
                  </>
                }
                checkedIcon={
                  <>
                    <div className="create-unchecked-color-status">{translate(TranslationEnum.manage_bucket,"WHITE")}</div>
                  </>
                }
                height={23}
                width={65}
                className="create-basket-color-switch"
              />
            </div>
          <label className="create-basket-input-labels">{translate(TranslationEnum.manage_bucket,"BUCKET SUBTITLE")}</label>
          <TextField
            id="outlined-start-adornment"
            size="small"
            value={bucketTextFieldData.subtitle}
            placeholder={translate(TranslationEnum.manage_bucket,"Enter Bucket Subtitle")}
            onChange={(event) => {
              const value = event.target.value;
              if(!bucketTextFieldFlag.subtitle) setBucketTextFieldFlag({...bucketTextFieldFlag, subtitle: true});
              setBucketTextFieldData({ ...bucketTextFieldData, subtitle: value });
            }}
            error = { bucketTextFieldFlag.subtitle && Boolean(subtitleHelperText) }
            helperText = { bucketTextFieldFlag.subtitle && subtitleHelperText }
          />
          <div className="create-basket-input-labels">
              <span>{translate(TranslationEnum.manage_bucket,"SUBTITLE COLOR")}</span>
              <Switch
                onChange={() => {
                  setSubtitleColorToggle(!subtitleColorToggle);
                }}
                checked={subtitleColorToggle}
                offColor="#000000"
                onColor="#ffffff"
                onHandleColor="#000000"
                offHandleColor="#ffffff"
                size={22}
                handleDiameter={19}
                uncheckedIcon={
                  <>
                    <div className="create-checked-color-status">{translate(TranslationEnum.manage_bucket,"BLACK")}</div>
                  </>
                }
                checkedIcon={
                  <>
                    <div className="create-unchecked-color-status">{translate(TranslationEnum.manage_bucket,"WHITE")}</div>
                  </>
                }
                height={23}
                width={65}
                className="create-basket-color-switch"
              />
            </div>
          </>}
          {blockSelectionState.blockConfigEnabled &&
           <>
            <label className="create-basket-input-labels">BLOCK</label>
            <Autocomplete
                  disablePortal
                  // disabled={isEdit}
                  disabled={locationState?.blockData}
                  size="small"
                  id="bannerTemplateTypes"
                  options={blockSelectionState.blockOptions}
                  getOptionLabel={(option) => {
                      return option.id?  (option.id + " - " + option.name) : "" ;
                  }}
                  value={blockSelectionState.selectedBlock}
                  onChange={(e,value) => {
                    if(value)
                      setBlockSelectionState({
                        ...blockSelectionState,
                        selectedBlock: value,
                        isChanged: true
                      })
                  }}
                  renderInput={(params) => <TextField {...params} placeholder="Select Block to link" />}
              />
          </>
          }
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
             {bucketDesign && bucketDesign !== "1DGrid" &&
           <FormControlLabel
              sx={{ mt: 1.5 }}
              control={
                <MUISwitch
                  checked={viewAll === true}
                  onChange={handleToggle}
                />
              }
              label={translate(TranslationEnum.manage_bucket, "View All")}
            />
}
            {bucketDesign === "1DGrid" && <FormControlLabel
              sx={{ mt: 1.5 }}
              control={
                <MUISwitch
                  checked={sticky === true}
                  onChange={handleStickyToggle}
                />
              }
              label={translate(TranslationEnum.manage_bucket, "Sticky")}
            />}
            </div>
          {bucketDesign==="Carousel" || bucketDesign==="1DGrid" || bucketDesign==="Need Based Basket Banner"?<div className="create-basket-input-labels" style={{display:"flex",gap:"10px"}}>
            BACKGROUND TYPE{" "}
            <Switch
              onChange={(checked) => {
                setBucketBackgroundImage(null);
                setBucketBackgroundColor("#ffffff");
                if(!checked) setBucketBackgroundBlobkey("")
                setBucketBackgroundType(checked ? "Image" : "Color");
              }}
              checked={bucketBackgroundType === "Image"}
              offColor="#237c9d"
              onColor="#24c6b1"
              disabled={bucketDesign==="Carousel"}
              size={22}
              handleDiameter={19}
              uncheckedIcon={
                <>
                  <div className="toggle-unchecked-icon-status">COLOR</div>
                </>
              }
              checkedIcon={
                <>
                  <div className="toggle-checked-icon-status">IMAGE</div>
                </>
              }
              height={23}
              width={65}
            />
             {bucketDesign === "1DGrid" && (
                <Tooltip
                  title="Changes apply to both app header and row, overriding any previous header style."
                  placement="right"
                  arrow
                  // componentsProps={{
                  //   tooltip: { sx: { bgcolor: 'red !important', color: '#fff !important' } },
                  //   arrow: { sx: { color: 'red !important' } },
                  // }}
                >
                  <InfoOutlinedIcon fontSize="small" style={{ cursor: "pointer", color: "#888" }} />
                </Tooltip>
    )}
          </div>:<></>}
          {renderBackgroundInput()}
          {bucketDesign==="campaignBanner"?<div style={{marginTop:"15px"}}>
          {/* GIF{" "}
          <UploadImageButton
          maxGifSize={maxGifSize}
          allowedType="both"
                    label={"GIF"}
                    setImage={setBucketGIFImage}
                    image={bucketGIFImage}
                    defaultImage={bucketBackgroundGIF}
                    setDefaultImage={setBucketBackgroundGIF}
                    resolution={{
                      width: 1024,
                      height: 600
                    }}
                  /> */}
              <div style={{ marginTop: 15 }}>
                <div style={{ marginBottom: 8 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="campaign-banner-type-label">{translate(TranslationEnum.manage_bucket, "Banner Type")}</InputLabel>
                    <Select
                      labelId="campaign-banner-type-label"
                      value={campaignBannerType}
                      label={translate(TranslationEnum.manage_bucket, "Banner Type")}
                      onChange={(e) => {
                        const value = e.target.value as "GIF" | "TOGGLE";
                        setCampaignBannerType(value);

                        if (value === "TOGGLE") {
                          setToggleItems((prev) => {
                            if (prev.length >= 2) return prev;
                            return [
                              {
                                id: crypto.randomUUID(),
                                backgroundFile: null,
                                toggleFile: null,
                                backgroundUrl: "",
                                toggleUrl: ""
                              },
                              {
                                id: crypto.randomUUID(),
                                backgroundFile: null,
                                toggleFile: null,
                                backgroundUrl: "",
                                toggleUrl: ""
                              }
                            ];
                          });
                          setBucketGIFImage(null);
                          setBucketBackgroundGIF("");
                        } else {
                          setToggleItems([]);
                          setBucketGIFImage(null);
                          setBucketBackgroundGIF("");
                        }
                      }}
                    >
                      <MenuItem value="GIF">GIF</MenuItem>
                      <MenuItem value="TOGGLE">Transition Banner</MenuItem>
                    </Select>

                  </FormControl>
                </div>

                {campaignBannerType === "GIF" ? (
                  <>
                    <div style={{ marginTop: 8 }}>
                      GIF{" "}
                      <UploadImageButton
                      maxImageSize={maxImageSize}
                        maxGifSize={maxGifSize}
                        allowedType="both"
                        label={"GIF"}
                        setImage={setBucketGIFImage}
                        image={bucketGIFImage}
                        defaultImage={bucketBackgroundGIF}
                        setDefaultImage={setBucketBackgroundGIF}
                        resolution={{
                          width: 1024,
                          height: 600
                        }}
                        useSaleshub={useSaleshub}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginTop: 8 }}>
                      {toggleItems.map((it, idx) => (
                        <div key={it.id || idx} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: 6 }}>{translate(TranslationEnum.manage_bucket, "Background URL")}</label>
                            <UploadImageButton
                            maxImageSize={maxImageSize}
                            maxGifSize={maxGifSize}
                              allowedType="both"
                              label={"Background"}
                              setImage={(value) => {
                                const file =
                                  typeof value === "function"
                                    ? value(it.backgroundFile || null)
                                    : value;

                                updateToggleItem(idx, { backgroundFile: file });
                              }}
                              image={it.backgroundFile || null}
                              defaultImage={it.backgroundUrl}
                              setDefaultImage={(value) => {
                                const url =
                                  typeof value === "function"
                                    ? value(it.backgroundUrl || "")
                                    : value;

                                updateToggleItem(idx, { backgroundUrl: url });
                              }}
                              resolution={{
                                width: 1024,
                                height: 600
                              }}
                              useSaleshub={useSaleshub}
                            />

                          </div>

                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: 6 }}>{translate(TranslationEnum.manage_bucket, "Toggle URL")}</label>
                            <UploadImageButton
                            maxGifSize={maxGifSize}
                              allowedType="both"
                              label={"Toggle"}
                              setImage={(value) => {
                                const file =
                                  typeof value === "function"
                                    ? value(it.toggleFile || null)
                                    : value;

                                updateToggleItem(idx, { toggleFile: file });
                              }}
                              image={it.toggleFile || null}
                              defaultImage={it.toggleUrl}
                              setDefaultImage={(value) => {
                                const url =
                                  typeof value === "function"
                                    ? value(it.toggleUrl || "")
                                    : value;

                                updateToggleItem(idx, { toggleUrl: url });
                              }}
                              resolution={{
                                width: 180,
                                height: 120
                              }}
                              useSaleshub={useSaleshub}
                            />

                          </div>

                          <div>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => removeToggleItem(idx)}
                            >
                              {translate(TranslationEnum.common_portal, "REMOVE")}
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div>
                        <Button variant="outlined" onClick={addToggleItem} disabled={toggleItems.length >= 5}>
                          + {translate(TranslationEnum.manage_bucket, "Add More")}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {campaignBannerType === "TOGGLE" && (
                <div style={{ marginTop: 16, maxWidth: 250 }}>
                  <Autocomplete
                    size="small"
                    options={togglePositionOptions}
                    getOptionLabel={(option) => option.label}
                    value={togglePositionOptions.find(opt => opt.value === togglePosition) || null}
                    onChange={(_, newValue) => setTogglePosition(newValue ? newValue.value : null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Toggle Position"
                        // required
                        error={!togglePosition}
                        helperText={!togglePosition ? "Please select toggle position" : ""}
                      />
                    )}
                  />
                </div>
              )}

              
                  <div style={{marginTop:"25px"}}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack direction="row" spacing={3}>
                <DesktopDatePicker
  label={translate(TranslationEnum.common_portal, "Start Date")}
  format="DD/MM/YYYY"
  value={startDate}
  onChange={handleStartDate}
  slotProps={{
    textField: {
      error: Boolean(dateValidation.startDate),
      helperText: dateValidation.startDate,
    },
  }}
/>

<DesktopDatePicker
  label={translate(TranslationEnum.common_portal, "End Date")}
  format="DD/MM/YYYY"
  value={endDate}
  onChange={handleEndDate}
  slotProps={{
    textField: {
      error: Boolean(dateValidation.endDate),
      helperText: dateValidation.endDate,
    },
  }}
/>

                </Stack>
              </LocalizationProvider>
                  </div>
         
          </div>:<></>}
                      {bucketDesign === "1DGrid" && <>
              {<><label className="create-basket-input-labels" style={{display:"flex",gap:"10px"}}>{translate(TranslationEnum.manage_bucket,"OVERLAY COLOR")}
                 <div style={{ fontSize: "12px", color: "#1C7EA0",marginLeft:"0px",backgroundColor: "#d6e4ec",padding:"3px",borderRadius:"2px" }}>
                 (Enabled only when layout is Sticky with an Image background)
                </div>
                <Tooltip title="If left empty, the image stays while scrolling. If set, this color replaces the image." placement="right"
                  arrow
                  // componentsProps={{
                  //   tooltip: { sx: { bgcolor: 'red !important', color: '#fff !important' } },
                  //   arrow: { sx: { color: 'red !important' } },
                  // }}
                  >
                  <InfoOutlinedIcon fontSize="small" style={{ cursor: "pointer", color: "#888" }} />
                </Tooltip>
                </label> 
              <TextField
                id="outlined-start-adornment"
                size="small"
                value={bucketStaticColor}
                placeholder={"Select Overlay Color"}
                onChange={handleStaticColorChange}
                InputProps={{
                  endAdornment: (
                    <input
                      style={{padding: "0",width:"60px"}}
                      type="color"
                      id="color-picker"
                      value={bucketStaticColor}
                      onChange={handleStaticColorChange}
                      disabled={(bucketBackgroundType !== "Image" || !sticky)}
                    />
                  ),
                }}
                disabled={(bucketBackgroundType !== "Image" || !sticky)}
                error={!isValidColor}
                helperText={!isValidColor && "Please select a valid hex code"}
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-disabled": {
                      backgroundColor: "#F8F8F8",
                    },

                    "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-input::placeholder": {
                      color: "#A2A2A2",
                      opacity: 1,
                    },

                    "& .MuiOutlinedInput-input.Mui-disabled": {
                      color: "#A2A2A2",
                      WebkitTextFillColor: "#A2A2A2",
                    },

                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "transparent",
                    },
                  }}
              /></>}
              {/* <label className="create-basket-input-labels">{translate(TranslationEnum.manage_bucket,"MIN BOXES")}</label> 
              <TextField
                type="number"
                size="small"
                value={minBoxes}
                onChange={(e) => setMinBoxes(e.target.value)}
                placeholder="Enter number"
                inputProps={{ min: 0 }}
              /> */}
            </>
            }
          {bucketDesign==="Carousel" || bucketDesign === "Grid" || bucketDesign === "1DGrid" ?<><label className="create-basket-input-labels">BUCKET TYPE</label>
          <Autocomplete
            disableClearable
            sx={{ width: "100%" }}
            value={primaryType}
            onChange={async (event, value: string) => {
              setPrimaryType(value);
              if (value === "Pack Size") {
                setPrimaryTypeOptions(packSizes);
              } else if (value === "Category") {
                setPrimaryTypeOptions(categories);
              } else if (value === "Brand") {
                setPrimaryTypeOptions(brands);
              }else if (value === "Company") {
                setPrimaryTypeOptions(company);
              }else if (value === "Sub Category") {
                setPrimaryTypeOptions(subCategory);
              }else if (value === "Sub Brand") {
                setPrimaryTypeOptions(subBrand);
              } else if (value === "Piece Size Description") {
                setPrimaryTypeOptions(pieceSizeDesc);
              }else if (value === "Brand Code") {
                setPrimaryTypeOptions(brandCode);
              }else if (value === "Ctg") {
                setPrimaryTypeOptions(ctg);
              }else{
                setPrimaryTypeOptions(smartBuys);
              }
              if(selectedPrimaryTypesState.length>0) setSelectedPrimaryTypesState([]);
              if(selectedPrimaryTypes.length) setSelectedPrimaryTypes([]);
              if(secondaryType) setSecondaryType("");
              setSecondaryBucketTypes(
                bucketTypes.filter((option: string) => option !== value)
              );
            }}
            options={bucketTypes.filter((option: string) => option !== secondaryType)}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={translate(TranslationEnum.manage_bucket,"Select Bucket Type")}
              />
            )}
          /></>:<></>}</>}
          {renderBucketTypeInputs()}
          <div className="create-bucket-submit-button-container">
            <button
              onClick={() => handleBucketSubmit()}
              className="create-bucket-submit-button"
              disabled={showSubmitLoader}
            >
              {showSubmitLoader? (
                <div>
                  <CircularProgress size={15} color="inherit" />
                  <span className="circular-progress-container ">{translate(TranslationEnum.common_portal,"SUBMIT")}</span>
                </div>
              ) : (
                <>{translate(TranslationEnum.common_portal,"SUBMIT")}</>
              )}
            </button>
          </div>
        </div>
      </>: <Loader />}
      <GenericPopUp
        type={popupType}
        message={popupMessage}
        setOpenGenericModal={popupType==="Success"?() => {
            setOpenGenericModal(false);
            window.history.back();
          }: setOpenGenericModal}
        openGenericModal={openGenericModal}
      />
    </div>
  )
}

export default CreateBucket;


