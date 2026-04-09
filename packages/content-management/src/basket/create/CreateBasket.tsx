import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faCamera,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import Switch from "react-switch";
import {
  Autocomplete,
  Button,
  CircularProgress, 
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import "./CreateBasket.css";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppliesOnOption,
  basketDoaminType,
  basketRequestBody,
  blobArrayType,
  blobResponse,
  CreateBasketProps,
  navigateType,
  UploadImageType,
  valueType,
} from "@/features/content-management/basket/manage/ManageBasketTypes";

import {
  getMultipleBlob,
  getSecondaryFeatures,
} from "../../services/manageBasketService";
import { getMultipleBlobViaDocumentsApi } from "@/services/documentUploadService";
import { GenericPopUp } from "@/components/popup/genericPopUp";
import { metaDataBatchPayload, popupType } from "@/types";
import { validateWithOtp } from "@/utils/validateOtpPopupActions";
// import { manageUpdateAccessObj } from "../../features/manageUpdateAccess/manageUpdateAccessTypes";
import { getMetaDataConfig,  getNewMetaDataConfig, validateMetaDataResponse } from "@/utils/UtilityService";
import { configurationAttributeType } from "@/types";
import { BlockSelectionState, retailerAppLayoutConfigObj } from "@/features/content-management/block/create/CreateBlockTypes";
import { defaultBlockObj } from "@/features/content-management/block/create/BlockType";
import { getConfigFromClientConfig } from "@/features/content-management/services/bannerServices";
import { getAvailableBlockOptionsOfType, getBlockMetaData, getClientConfigDomainType, getConfigKeyValue, getLinkedBlock, getUpdatedRoleAppLayoutConfig, getWholeSellerConfiguration, updateSelectedBlockData } from "@/features/content-management/services/manageHomeScreenService";
// import { getLob } from "../../services/authenticationService";
import { updateConfigRequestBody } from "@/utils/UtilityService";
import { ChannelkartNetworkGet, ChannelkartNetworkPost, defaultTokenNew, META_DATA_BATCH_API, tokenNew } from "@/utils/networkServiceSimple";
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";
import { OptionType } from "@/utils/UtilityService";
import { useSelector } from "react-redux";
import { store } from "@/utils/UtilityService";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Checkbox from "@mui/material/Checkbox";
import { getLob } from "@/utils/UtilityService";
import axios from "axios";
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

// Hardcoded token and tenant ID for saleshub API

type LevelOption = {
  id: string;
  label: string;
};

export interface manageUpdateAccessObj {
  phoneNumber: string,
  isAdmin: boolean,
  countryCode: string,
  userName: string
}


const transformBasketToSaleshubPayload = (basket: any) => {
  const tags = basket.tag ? [basket.tag] : [];
  const type = basket.type ? String(basket.type).toUpperCase() : "";
  
  return {
    name: basket.title || "",
    type,
    config: {
      tags,
    },
    active: basket.status === "active",
  };
};

const UploadImageButton = ({
  label,
  imageState: { imageFile, setImageFile },
  defaultImage,
  editRequest: { editRequestBody, setEditRequestBody },
  setCheck,
  openPopUp,
  blobName,
  error,
  resolution: { height, width },
}: UploadImageType) => {
  const { translate } = usePortalTranslation();
  const CUR_COMPONENT_COMMON="commonPortal";
  const CUR_COMPONENT = "Manage Basket"
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alreadyPresentFile, setAlreadyPresentFile] = useState(defaultImage);
  const [validResolution, setValidResolution] = useState(true);

  const validateImage = (file: File) => {
    if (file) {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        if (height === image.naturalHeight && width === image.naturalWidth) {
          setImageFile(file);
          setValidResolution(true);
        } else {
          setImageFile(null);
          setValidResolution(false);
        }
      };
      image.src = url;
    }
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      validateImage(event.target.files[0]);
    }
    event.target.value = "";
  };

  const handleReset = () => {
    if (defaultImage) {
      setAlreadyPresentFile("");
      setEditRequestBody({
        ...editRequestBody,
        [blobName]: "",
      });
    }
    if (imageFile) {
      setImageFile(null);
    }
  };

  return (
    <>
      {label ? (
        <label className="create-basket-input-labels">{label}</label>
      ) : (
        <></>
      )}
      <div className="create-basket-image-input">
        <div
          className="create-basket-image-upload"
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          {imageFile ? (
            <>
              <img
                className="product-image"
                src={URL.createObjectURL(imageFile)}
                height="60"
                width="auto"
                alt="productImage"
              />
            </>
          ) : alreadyPresentFile ? (
            <>
              <img
                className="product-image"
                src={alreadyPresentFile}
                height="60"
                width="auto"
                alt={label}
              />
            </>
          ) : (
            <>
              <FontAwesomeIcon fontSize="45px" icon={faCamera} />
              <Typography variant="subtitle1">
                <>
                  Upload Image ({width}X{height})
                </>
              </Typography>
            </>
          )}
          {!validResolution || error ? (
            <Typography variant="subtitle1" color="red">
              {!validResolution ||
              (error &&
                !editRequestBody[blobName as keyof valueType] &&
                !imageFile)
                ? translate(TranslationEnum.manage_basket, "Please upload an image with dimensions of {width}X{height}",{"width":width.toString(),"height":height.toString()})
                : ""}
            </Typography>
          ) : (
            <></>
          )}
          <input
            type="file"
            onChange={(event) => {
              handleUpload(event);
              setCheck(true);
            }}
            hidden
            ref={fileInputRef}
            accept=".png,.jpg,.jpeg"
          />
        </div>
        {imageFile || defaultImage ? (
          <FontAwesomeIcon
            className="create-basket-cross-button"
            icon={faXmark}
            onClick={() => {
              setCheck(true);
              handleReset();
            }}
          />
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

const CreateBasket = (props: CreateBasketProps) => {
  const { translate } = usePortalTranslation();
  const [useBeta, setUseBeta] = useState<boolean>(false);
  const CUR_COMPONENT = "Manage Basket"
  const CUR_COMPONENT_COMMON="commonPortal";
  const location = useLocation();
  const [backGroundImage, setBackGroundImage] = useState<File | null>(null);
  const [displayImage, setDisplayImage] = useState<File | null>(null);
  const [basketTitleIcon, setbasketTitleIcon] = useState<File | null>(null);
  const state: navigateType = location.state as navigateType;
  console.log("state",state)
  const [editRequestBody, setEditRequestBody] = useState<valueType>(state?.row || {});
  const navigate = useNavigate();
  const [genericModalState, setGenericModalState] = useState(false);
  const [genericModalMessage, setGenericModalSMessage] = useState("");
  const [genericModaltype, setGenericModalType] = useState<popupType>("Error");
  const [error, setError] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [check, setCheck] = useState(false);
  const [isIdExist, setIsIdExist] = useState<boolean>(false);
  const [isValidColor, setIsValidColor] = useState<boolean>(true);
  const [colorSwitch, setColorSwitch] = useState<boolean>(
    editRequestBody?.backGroundColor ? true : false
  );

  const [titleColor, setTitleColor] = useState<boolean>(
    editRequestBody?.titleColor === "#ffffff" ? true : false
  );
  const [subTitleColor, setSubTitleColor] = useState<boolean>(
    editRequestBody?.subTitleColor === "#ffffff" ? true : false
  );

  const [otherSource, setOtherSource] = useState<string>("");
  const [showSbuFilelds, setShowSbuFilelds] = useState<boolean>(false);
  const [sbuBasketEnabled, setSbuBasketEnabled] = useState<boolean>(false);
  const [saleshubPostAPI, setSaleshubPostAPI] = useState<boolean>(false);
  const [useSaleshub, setUseSaleshub] = useState<boolean>(false);
  const [wholeSellerConfig, setWholeSellerConfig] = useState<boolean>(false);

  useEffect(() => {
    const fetchPortalConfig = async () => {
      // const portalConfig = await getMetaDataConfig("clientconfig", "portal_configuration");
      // const portal_config: configurationAttributeType[] = portalConfig?.domainValues ?? [];

      const clientConfig = await getNewMetaDataConfig();
      console.log("clientConfig",clientConfig)
      const portal_config: configurationAttributeType[] =
        clientConfig?.find((config: any) => config.domainType === "portal_configuration")?.domainValues ?? [];

      const wholeSellerCfg = portal_config?.find(
        (item) => item.name === "wholeSellerConfig"
      )?.value ?? false;
      const saleshubPostAPIVal = portal_config?.find(
        (item) => item.name === "saleshubPostAPI"
      )?.value ?? false;
      const useSalesHub = portal_config?.find(
        (item) => item.name === "useSaleshub"
      )?.value ?? false;

      console.log("Setting saleshubPostAPI to:", saleshubPostAPIVal);
      setSaleshubPostAPI(saleshubPostAPIVal);
      setUseSaleshub(useSalesHub);
      setWholeSellerConfig(wholeSellerCfg);
    };
    fetchPortalConfig();
  }, []);



  const handleColorChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    filedName: string
  ) => {
    const colour = event.target.value;
    if (colour.length > 0 && !isValidHexColor(colour)) {
      setIsValidColor(false);
    } else {
      setIsValidColor(true);
    }
    setEditRequestBody({ ...editRequestBody, [filedName]: colour });
    setCheck(true);
  };

  const openPopUp = (message: string, modalType: popupType) => {
    setGenericModalSMessage(message);
    setGenericModalState(true);
    setGenericModalType(modalType);
  };

  const [disableColorPicker, setDisableColorPicker] = useState(false);

  useEffect(() => {
    isDisabledColorPicker(editRequestBody?.type);
    getDataSource();
  }, []);

  const basketMappedWithCOlor = [
    {
      basketType: "recommendedOrder3",
      color: "#ff0000",
      tagName: "Hot sell basket",
      disable: true,
    },
    { basketType: "regular", color: "#FFFF00", tagName: "", disable: false },
    {
      basketType: "recommendedOrder4",
      color: "#90EE90",
      tagName: "New basket",
      disable: true,
    },
    {
      basketType: "recommendedOrder5",
      color: "#FFA500",
      tagName: "",
      disable: false,
    },{
      basketType: "recommendedOrder6",
      color: "#000000",
      tagName: "",
      disable: false,
    },{
      basketType: "recommendedOrder7",
      color: "#000000",
      tagName: "",
      disable: false,
    },{
      basketType: "recommendedOrder8",
      color: "#000000",
      tagName: "",
      disable: false,
    },{
      basketType: "assortment",
      color: "#000000",
      tagName: "",
      disable: false,
    }
  ];
  const [dataSourceOptions, setDataSourceOptions] = useState<string[]>();
  const [levelOptions, setLevelOptions] = useState<LevelOption[]>([]);
  const [appliesOnOptions, setAppliesOnOptions] = useState<string[]>();  
  const [appliesOnConfig, setAppliesOnConfig] = useState<AppliesOnOption[]>();
  const basketConfigExists = useRef<boolean>(false);
  const basketConfigRef = useRef<basketDoaminType[]>();
  const clientConfigRef = useRef<any[]>([]);
  const [blockSelectionState,setBlockSelectionState] = useState<BlockSelectionState>({
    selectedBlock: defaultBlockObj,
    blockOptions: [],
    blockConfigEnabled: false,
    isChanged: false
  })
  const savedRole:any = useSelector(() => store.getState().roleState.role) 
  const [roleOptions, setRoleOptions] = useState<OptionType[]>([]);
  console.log("roleOptions",roleOptions)
  useEffect(()=>{
    const getAndSetDataSourceOptions = async ()=>{
      const configName = "order_basket_configuration"
      // const clientConfig = await getMetaDataConfig("clientconfig");
      const clientConfig = await getNewMetaDataConfig();
      // const basketConfig = clientConfig.find((config: { domainType: string }) => config.domainType === configName)?.domainValues;
      clientConfigRef.current = clientConfig;
      const basketConfig = getConfigFromClientConfig(clientConfig,configName);
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
      
      const portalConfigurations = getConfigFromClientConfig(clientConfig,'portal_configuration');
      const isSbuBasketEnabled = getConfigKeyValue(portalConfigurations,"sbuBasketEnabled")
      if (typeof isSbuBasketEnabled === "boolean") {
        setSbuBasketEnabled(isSbuBasketEnabled);
      }
      const newBlockSelectionState = {...blockSelectionState}
      if(allBlocks && Array.isArray(allBlocks)){
        newBlockSelectionState.blockConfigEnabled = true;
        newBlockSelectionState.blockOptions = getAvailableBlockOptionsOfType("Basket",allBlocks!);
      }
      if(basketConfig){
        basketConfigExists.current = true;
        basketConfigRef.current = basketConfig
        if(state.row?.id){
          if(newBlockSelectionState.blockConfigEnabled){
            const linkedBlock = getLinkedBlock(allBlocks!,"Basket",state.row.id);
            if(linkedBlock){
              newBlockSelectionState.selectedBlock = linkedBlock;
              newBlockSelectionState.blockOptions = [...newBlockSelectionState.blockOptions,linkedBlock];
            } 
          }
          const allBaskets = basketConfig[0].value as valueType[];
          const tempCurBasket = allBaskets.find((basket: valueType) => basket.id === state.row.id);
          if(tempCurBasket){
            setEditRequestBody({...tempCurBasket});
            if(tempCurBasket.template==='Products'){
            setSbuBasketEnabled(true);
            setShowSbuFilelds(true)
            }
          } 
        }
        setBlockSelectionState(newBlockSelectionState);
      }
      if(state?.blockData){  
        setBlockSelectionState((prevState) => {
            return {
                ...prevState,
                selectedBlock: state?.blockData,
                isChanged: true,
                blockConfigEnabled: true
            }
        })
      }
      const rawOptions = getConfigKeyValue(
        portalConfigurations,
        "levelOptions"
      );

      const options: LevelOption[] = Array.isArray(rawOptions)
        ? rawOptions
        : [];

      setLevelOptions(options);
      if(editRequestBody?.template==="Products"){
        //TODO: get options from config
        const portalConfigurations = getConfigFromClientConfig(clientConfig,'portal_configuration');
        const basketDataSourceOptions = getConfigKeyValue(portalConfigurations,"basketDataSource")
        const datasourceLabels = basketDataSourceOptions?.map(option => option.label)||[];
        setDataSourceOptions(datasourceLabels);
        const appliesOnOptions = getConfigKeyValue(portalConfigurations,"appliesOn")
        setAppliesOnConfig(appliesOnOptions);
        const appliesOnlabels = appliesOnOptions?.map(option => option.label)||[];
        setAppliesOnOptions(appliesOnlabels)
        // setDataSourceOptions(["Schemes"])
      }else{
        // const secondaryOptions:string[] = await getSecondaryFeatures();
        const defaultBasketOptions = basketMappedWithCOlor.map(basket=>basket.basketType);
        setDataSourceOptions([...defaultBasketOptions,"Others"])
      }
    }
    getAndSetDataSourceOptions()
  },[editRequestBody?.template,savedRole])
  const checkIsAlreadyPresent = (id: string | undefined) => {
    let isPresent = false;
    if (id) {
      const allBaskets = state?.domainValues[0]?.value;
      allBaskets.forEach((eachBasket: valueType) => {
        if (eachBasket.id === id) {
          isPresent = true;
          return;
        }
      });
    }
    return isPresent;
  };

  const isValidHexColor = (colorString: string) => {
    if (colorString.length < 7) {
      return false;
    }
    return /^#([0-9A-F]{3}){1,2}$/i.test(colorString);
  };

  const getDataSource = () => {
    if (editRequestBody?.type) {
      const isTypePresent = basketMappedWithCOlor.find((eachBasket) => {
        return eachBasket.basketType === editRequestBody.type;
      });
      if (isTypePresent) {
        return editRequestBody.type;
      } else {
        setEditRequestBody({
          ...editRequestBody,
          type: "Others",
        });
        setOtherSource(editRequestBody.type);
      }
    } else {
      return "";
    }
  };

  const isDisabledColorPicker = (basketType: string | undefined) => {
    if (basketType) {
      basketMappedWithCOlor.forEach((eachBasket) => {
        if (basketType === eachBasket.basketType) {
          setDisableColorPicker(eachBasket.disable);
        }
      });
    }
  };


  const getColourAndTag = (basketType: string) => {
    const baskets = basketMappedWithCOlor.find((eachBasket) => {
      return basketType === eachBasket.basketType;
    });
    if (baskets) {
      setEditRequestBody({
        ...editRequestBody,
        type: basketType,
        tagColor: baskets.color,
        tag: baskets.tagName,
      });
    }else{
      setEditRequestBody({
        ...editRequestBody,
        type: basketType,
        tagColor: "",
        tag: "",
      });
      setDisableColorPicker(false)
    }
  };

  const transformToSaleshubPayload = (basketData: valueType) => {
    const tags = basketData.tag ? [basketData.tag] : [];
    const type = basketData.type ? basketData.type.toUpperCase() : "";
    
    return {
      id: basketData.id || new Date().getTime().toString(),
      name: basketData.title || "",
      type: type,
      config: {
        tags: tags
      },
      active: basketData.status === "active"
    };
  };

  const uploadBasketData = async () => {
    try {
      let message = "";
      if(props.validateAllParentInputs) message = props.validateAllParentInputs();
      if(message!==""){
        openPopUp(message,"Alert");

        setError(true);
        setShowLoader(false);
        return;
      }
      if (!editRequestBody?.type ||
        editRequestBody.type?.trim().length === 0 ||
        ((!editRequestBody?.title ||
          editRequestBody.title.trim().length === 0) && !showSbuFilelds) ||
        (editRequestBody.type === "Others" && !otherSource) ||
        (editRequestBody.tagColor &&
          !isValidHexColor(editRequestBody.tagColor)) ||

        (!showSbuFilelds && !editRequestBody?.basketTitleIconBlobKey && !basketTitleIcon) ||
        (showSbuFilelds && ( (colorSwitch &&
          editRequestBody.backGroundColor &&
          !isValidHexColor(editRequestBody.backGroundColor)) || (!colorSwitch && !backGroundImage && !editRequestBody.backgroundImageBlobKey))) ||

        (colorSwitch &&
          editRequestBody.backGroundColor &&
          !isValidHexColor(editRequestBody.backGroundColor))
      ) {
        setError(true);
        setShowLoader(false);

        openPopUp("Some Basket Fields are invalid","Alert");
        return;
      }
      // if(!useBeta && blockSelectionState.blockConfigEnabled && !blockSelectionState.selectedBlock.id){
      //   setShowLoader(false);
      //   openPopUp("Please select a block","Alert");
      //   return;
      // }

      if (
        (editRequestBody.subtitle && editRequestBody.subtitle.length > 50) ||
        (editRequestBody?.title  && editRequestBody.title.length > 30) ||
        (editRequestBody.tag && editRequestBody.tag.length > 15)
      ) {
        setShowLoader(false);

        openPopUp("Some Basket Fields are invalid","Alert");
        return;
      }
      if (showSbuFilelds && !editRequestBody?.appliesOn) {
        setShowLoader(false);
        openPopUp("Some Basket Fields are invalid","Alert");
        return;
      }
      const fieldName = editRequestBody?.appliesOn?.toLowerCase() + "Names";
      if (showSbuFilelds && !editRequestBody[fieldName]) {
        setShowLoader(false);
        openPopUp("Some Basket Fields are invalid","Alert");
        return;
      }

      const formData = new FormData();

      if (backGroundImage) {
        formData.append("files", backGroundImage);
      }
      if (displayImage) {
        formData.append("files", displayImage);
      }
      if (basketTitleIcon) {
        formData.append("files", basketTitleIcon);
      }

      const payload: blobArrayType = {};
      const allFiles = formData.getAll("files");
      if (allFiles.length > 0) {
        const blobKeys = useSaleshub
          ? await getMultipleBlobViaDocumentsApi(formData)
          : await getMultipleBlob(formData);

        if (blobKeys.status !== 200 && blobKeys.status !== 201) {
          throw new Error();
        }

        blobKeys?.data.forEach((eachBlob: blobResponse) => {
          const blobUri = JSON.parse(eachBlob.body);
          if (backGroundImage && !payload.backgroundImageBlobKey) {
            payload.backgroundImageBlobKey = blobUri.features[0].Uri;
          } else if (displayImage && !payload.displayImageBlobKey) {
            payload.displayImageBlobKey = blobUri.features[0].Uri;
          } else if (basketTitleIcon && !payload.basketTitleIconBlobKey) {
            payload.basketTitleIconBlobKey = blobUri.features[0].Uri;
          }
        });
      }
      const trimmedEditRequestBody: valueType = {
        ...editRequestBody,
        title: editRequestBody?.title?.trim(),
        subtitle: editRequestBody?.subtitle?.trim(),
        type: editRequestBody?.type?.trim()
      }
      const requestBody = {
        ...trimmedEditRequestBody,
        ...payload,
        status: "active",
      };
      if(!state?.row?.id) requestBody.id = new Date().getTime().toString(); // if user is creating basket
      if (colorSwitch) {
        delete requestBody.backgroundImageBlobKey;
      } else {
        delete requestBody.backGroundColor;
      }

      if (!requestBody.backGroundColor && !requestBody.backgroundImageBlobKey) {
        requestBody.backGroundColor = "#ffffff";
        delete requestBody.backgroundImageBlobKey;
      }

      if (requestBody.type === "Others") {
        requestBody.type = otherSource;
      }

      // adding  color if react switch is off state than black else it is white
      requestBody.titleColor = titleColor ? "#ffffff" : "#000000";
      requestBody.subTitleColor = subTitleColor ? "#ffffff" : "#000000";

      const newBasketConfig = [...basketConfigRef.current];
      const isUpdate = requestBody.id === state.row?.id;
      
      if (!isUpdate) {
        newBasketConfig[0].value.push({ ...requestBody });
      } else {
        const newValue = newBasketConfig[0].value.map((eachValue) => {
          if (eachValue.id === editRequestBody?.id) {
            return { ...requestBody };
          }
          return eachValue;
        });
        newBasketConfig[0].value = newValue;
      }
      let saleshubResponseId: string | null = null;
      if(saleshubPostAPI){
        try {
          const saleshubPayload = transformBasketToSaleshubPayload(requestBody);
          
          if (isUpdate) {
            const existingSaleshubId = state.row?.saleshubId;
            
            if (existingSaleshubId) {
              try {
                const saleshubResponse = await axios.put(
                  `https://api.salescodeai.com/baskets/${existingSaleshubId}`,
                  saleshubPayload,
                  {
                    headers: {
                      Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                      "x-tenant-id": getLob(),
                      "Content-Type": "application/json"
                    }
                  }
                );
                
                if (saleshubResponse.status >= 200 && saleshubResponse.status < 300) {
                  saleshubResponseId = saleshubResponse.data?.id || existingSaleshubId;
                } else {
                  const basketExistsInS3 = requestBody.id && state.row;
                  if (basketExistsInS3) {
                    try {
                      const createResponse = await axios.post(
                        "https://api.salescodeai.com/baskets",
                        saleshubPayload,
                        {
                          headers: {
                            Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                            "x-tenant-id": getLob(),
                            "Content-Type": "application/json"
                          }
                        }
                      );
                      
                      if (createResponse.status >= 200 && createResponse.status < 300) {
                        saleshubResponseId = createResponse.data?.id ?? null;
                      } else {
                        openPopUp("Failed to create basket in Saleshub after PUT failed","Error");
                      }
                    } catch (createError) {
                      openPopUp("Failed to create basket in Saleshub after PUT failed","Error");
                    }
                  } else {
                    openPopUp("Failed to update basket in Saleshub","Error");
                  }
                }
              } catch (putError: any) {
                const basketExistsInS3 = requestBody.id && state.row;
                if (basketExistsInS3) {
                  try {
                    const createResponse = await axios.post(
                      "https://api.salescodeai.com/baskets",
                      saleshubPayload,
                      {
                        headers: {
                          Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                          "x-tenant-id": getLob(),
                          "Content-Type": "application/json"
                        }
                      }
                    );
                    
                    if (createResponse.status >= 200 && createResponse.status < 300) {
                      saleshubResponseId = createResponse.data?.id ?? null;
                    } else {
                      openPopUp("Failed to create basket in Saleshub after PUT error","Error");
                    }
                  } catch (createError) {
                    openPopUp("Failed to create basket in Saleshub after PUT error","Error");
                  }
                } else {
                  openPopUp("Failed to update basket in Saleshub","Error");
                }
              }
            } else {
              const saleshubResponse = await axios.post(
                "https://api.salescodeai.com/baskets",
                saleshubPayload,
                {
                  headers: {
                    Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                    "x-tenant-id": getLob(),
                    "Content-Type": "application/json"
                  }
                }
              );
              
              if (saleshubResponse.status >= 200 && saleshubResponse.status < 300) {
                saleshubResponseId = saleshubResponse.data?.id ?? null;
              } else {
                openPopUp("Failed to create basket in Saleshub","Error");
              }
            }
          } else {
            const saleshubResponse = await axios.post(
              "https://api.salescodeai.com/baskets",
              saleshubPayload,
              {
                headers: {
                  Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                  "x-tenant-id": getLob(),
                  "Content-Type": "application/json"
                }
              }
            );
            
            if (saleshubResponse.status >= 200 && saleshubResponse.status < 300) {
              saleshubResponseId = saleshubResponse.data?.id ?? null;
            } else {
              openPopUp("Failed to create basket in Saleshub","Error");
            }
          }
        } catch (saleshubError) {
          openPopUp("Saleshub API error, continuing with S3 operation:","Error");
        }
      }
      if (saleshubResponseId) {
        const basketId = requestBody.id;
        const updatedValue = newBasketConfig[0].value.map((eachValue: valueType) => {
          if (eachValue.id === basketId) {
            return { ...eachValue, saleshubId: saleshubResponseId } as valueType;
          }
          return eachValue;
        });
        newBasketConfig[0].value = updatedValue;
      }

      const basketDataPayload: updateConfigRequestBody = {
        domainName: "clientconfig",
        domainType: "order_basket_configuration",
        domainValues: newBasketConfig,
        lob: getLob(),
      };
      const finalMetaDataPayload: metaDataBatchPayload = { features: [basketDataPayload] };
      if(blockSelectionState.isChanged && blockSelectionState.blockConfigEnabled && blockSelectionState.selectedBlock.id){
        const blockMetaData = getBlockMetaData(savedRole?.id,requestBody.id as string,blockSelectionState.selectedBlock,clientConfigRef.current);
        if(blockMetaData){
          finalMetaDataPayload.features.push(blockMetaData);
        }
        const wholeSellerLayoutConfig = getClientConfigDomainType(clientConfigRef.current,"wholesaler_app_layout_configuration");
        if(wholeSellerLayoutConfig && wholeSellerConfig){
            const role = "retailer";
            const configName = `${role}_app_layout_configuration`;
            const roleAppLayoutConfig = getClientConfigDomainType(clientConfigRef.current,configName);
            const updatedRoleLayoutConfig = getUpdatedRoleAppLayoutConfig(roleAppLayoutConfig,blockSelectionState.selectedBlock,requestBody.id as string);
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
        
        setShowLoader(false);
        
        if (response.status >= 200 && response.status < 300) {
          // const validationObj = validateMetaDataResponse(response?.data?.features);
          // if(validationObj.success){
          //   window.history.back();
          // }else{
          //   openPopUp(validationObj.message,"Error");
          // }
          window.history.back();
        } else {
          openPopUp("Something went wrong", "Error");
        }
      } catch (apiError) {
        setShowLoader(false);
        console.error("Failed to update configuration:", apiError);
        openPopUp("Something went wrong", "Error");
      }
      
      // validateWithOtp((verifiedUser?: manageUpdateAccessObj,verifyResponse?: any) => {
      //   doFinalSubmit(verifiedUser,verifyResponse);
      // },undefined,"all",META_DATA_BATCH_API,finalMetaDataPayload,"PUT");
    } catch (error) {
      openPopUp("Something went wrong", "Error");
    }
  };

  const doFinalSubmit = async (verifiedUser?: manageUpdateAccessObj,verifyResponse?: any) => {
    try {
      setShowLoader(true);
      if (verifyResponse.status >= 200 && verifyResponse.status < 300) {
        const validationObj = validateMetaDataResponse(verifyResponse?.data?.features);
        if(validationObj.success){
          window.history.back();
        }else{
         openPopUp(validationObj.message,"Error");
        }  
      } else {
        throw new Error();
      }
    } catch (error) {
      openPopUp("Something went wrong while submitting basket data", "Error");
    }finally{
      setShowLoader(false);
    }
  };
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const appliesOn = editRequestBody.appliesOn?.toLowerCase();
      const config = appliesOnConfig?.find((item) => item.id.toLowerCase() === appliesOn);
      if (!config) return;  
      try {
        const response = await ChannelkartNetworkGet(config.apiUrl);
        const data = response.data; 
        const newOptions = data
          .filter((item: any) => item[config.fieldKey] !== null)
          .map((item: any) => ({
            label: item[config.fieldKey],
            value: item[config.fieldKey],
          }));
        setOptions(newOptions);
      } catch (err) {
        console.error(`Failed to fetch options for ${appliesOn}`, err);
        setOptions([]);  
      }
    };
  
    loadOptions();
  }, [editRequestBody.appliesOn, appliesOnConfig]);
const skuFallback: LevelOption = { id: "sku", label: "SKU" };

// Compute selected option
const selectedLevelOption: LevelOption | undefined = useMemo(() => {
  if (!levelOptions || levelOptions.length === 0) return undefined; // don't show input
  return levelOptions.find((opt) => opt.id === editRequestBody?.level) ?? skuFallback;
}, [levelOptions, editRequestBody?.level]);
useEffect(() => {
  if (levelOptions && levelOptions.length > 0 && !editRequestBody?.level) {
    setEditRequestBody((prev) => ({
      ...prev,
      level: "sku",
    }));
  }
}, [levelOptions, editRequestBody?.level]);
  
  

  return (
    <>
      <div className="create-basket-parent">
        <div className="create-basket-label">
          <span>{state?.row?.id ? translate(TranslationEnum.manage_basket,"Update Basket") :  translate(TranslationEnum.manage_basket,"Create Basket")}</span>
          {!props.parentType?<button
            className="create-basket-label-back-button"
            onClick={() => {
              window.history.back();
            }}
          >
            BACK
          </button>:<></>}
        </div>
        <div className="create-basket-input-fields">
        {state?.row?.id && <><label className="create-basket-input-labels">{translate(TranslationEnum.manage_basket,"ENTER ID")}</label>
          <TextField
            id="outlined-start-adornment"
            size="small"
            defaultValue={editRequestBody?.id}
            disabled={state?.row?.id ? true : false}
            placeholder={translate(TranslationEnum.manage_basket,"Enter Id")}
            onChange={(e) => {
              setIsIdExist(false);
              setEditRequestBody({ ...editRequestBody, id: e.target.value });
              setCheck(true);
            }}
            onBlur={() => {
              if (checkIsAlreadyPresent(editRequestBody?.id)) {
                setIsIdExist(true);
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faPen} />
                </InputAdornment>
              ),
            }}
            error={
              isIdExist ||
              (!editRequestBody?.id && error) ||
              editRequestBody?.id?.length! > 10 ||
              !/^[a-zA-Z0-9_]*$/i.test(editRequestBody.id!)
            }
            helperText={
              isIdExist
                ? "Basket Id Already exist"
                : !editRequestBody?.id && error
                ? "required*"
                : ""
            }
          /></>}

    {(sbuBasketEnabled && (!state?.row?.id || (state?.row?.id && editRequestBody.template)  )) && 
    <>


    <label className="create-basket-input-labels">
          {translate(TranslationEnum.manage_basket,"BASKET TEMPLATE")}
          </label>
          <Autocomplete
            disableClearable
            sx={{ width: "100%" }}
            defaultValue={editRequestBody?.template}
            disabled={state?.row?.id ? true : false}
            value={editRequestBody ? editRequestBody.template : "Select"}
            onChange={(event, value: string | null) => {
              if(value){
                setEditRequestBody({
                  ...editRequestBody,
                  template: value,
                });
                setError(false)
              }
              if(value==="Products"){
                setShowSbuFilelds(true)
              }else{
                setShowSbuFilelds(false)
              }
            }}
            /* TODO: make these configuratble */
            options={ ["Products", "Recommendations"]}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={translate(TranslationEnum.manage_basket,"Select")}
                error={!editRequestBody?.template && error}
                helperText={!editRequestBody?.template && error && "required*"}
              />
            )}
          />

        </>
        }


        {(!sbuBasketEnabled ||
          editRequestBody.template || state?.row?.id) &&

          <>
  


          <label className="create-basket-input-labels">
          {translate(TranslationEnum.manage_basket,"BASKET DATA SOURCE")}
          </label>
          <Autocomplete
            disableClearable
            sx={{ width: "100%" }}
            value={editRequestBody ? editRequestBody.type : "Select"}
            onChange={(event, value: string | null) => {
              if (value) {
                getColourAndTag(value);
                isDisabledColorPicker(value);
                setCheck(true);
              }
            }}
            options={dataSourceOptions ?? []}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={translate(TranslationEnum.manage_basket,"Select")}
                error={!editRequestBody?.type && error}
                helperText={!editRequestBody?.type && error && "required*"}
              />
            )}
          />
           {levelOptions && levelOptions.length > 0 && (
  <>
    <label className="create-basket-input-labels">LEVEL</label>
    <Autocomplete
      disableClearable
      sx={{ width: "100%" }}
      size="small"
      options={levelOptions}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      value={selectedLevelOption}
      onChange={(event, value) => {
        setEditRequestBody((prev) => ({
          ...prev,
          level: value?.id ?? "sku",
        }));
        setError(false);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Select"
          error={!editRequestBody?.level && error}
          helperText={!editRequestBody?.level && error && "required*"}
        />
      )}
    />
  </>
)}


          {editRequestBody?.type === "Others" ? (
            <>
              <label className="create-basket-input-labels">
              {translate(TranslationEnum.manage_basket,"OTHER BASKET SOURCE")}
              </label>
              <TextField
                id="outlined-start-adornment"
                size="small"
                placeholder={translate(TranslationEnum.manage_basket,"Enter Basket Title")}
                value={otherSource}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <FontAwesomeIcon icon={faPen} />
                    </InputAdornment>
                  ),
                }}
                onChange={(event) => {
                  setOtherSource(event.target.value);
                  setCheck(true);
                }}
                error={
                  error && editRequestBody?.type === "Others"
                    ? !otherSource || otherSource.trim().length === 0
                      ? true
                      : false
                    : false
                }
                helperText={
                  error && editRequestBody?.type === "Others"
                    ? !otherSource || otherSource.trim().length === 0
                      ? "required*"
                      : ""
                    : ""
                }
              />
            </>
          ) : (
            <></>
          )}
          {blockSelectionState.blockConfigEnabled &&
           <>
            <label className="create-basket-input-labels">BLOCK</label>
            <Autocomplete
                  disablePortal
                  // disabled={isEdit}
                  disabled={state?.blockData}
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

          {showSbuFilelds &&

           <>
            <label className="create-basket-input-labels">APPLIES ON</label>
            <Autocomplete
                  disablePortal
                  // disabled={isEdit}
                  size="small"
                  id="bannerTemplateTypes"
                  // TODO: make these configuratble -> {["SBU", "Category", "Sub-Category", "Brands"]}
                  options={appliesOnOptions ?? []}
                  value={ editRequestBody.appliesOn}
                  onChange={(e,value) => {
                    if(value)
                      setEditRequestBody({
                        ...editRequestBody,
                        appliesOn: value,
                      })
                  }}
                  renderInput={(params) => <TextField {...params} placeholder="Applies On" />}
              />
{editRequestBody.appliesOn && 
<>
<label className="create-basket-input-labels">  {translate(TranslationEnum.manage_basket,`${editRequestBody.appliesOn.toLocaleUpperCase()} NAME`)}</label>
          {/* <TextField
            id="outlined-start-adornment"
            size="small"
            placeholder={translate(TranslationEnum.manage_basket,`Enter ${editRequestBody.appliesOn} Name`)}
            value={editRequestBody?.[editRequestBody.appliesOn.toLowerCase() + "Name"] || ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <FontAwesomeIcon icon={faPen} />
                </InputAdornment>
              ),
            }}
            onChange={(event) => {
              const key = editRequestBody.appliesOn
                ? editRequestBody.appliesOn.toLowerCase() + "Name"
                : "";
              setEditRequestBody({
                ...editRequestBody,
                [key]: event.target.value,
              });
              setCheck(true);
            }}
            error={
              ((!editRequestBody?.[editRequestBody.appliesOn.toLowerCase() + "Name"]  ||
                editRequestBody?.[editRequestBody.appliesOn.toLowerCase() + "Name"] .trim().length === 0) &&
                error) ||
              editRequestBody?.[editRequestBody.appliesOn.toLowerCase() + "Name"] ?.length! > 30
            }
            helperText={
              error &&
              (!editRequestBody?.[editRequestBody.appliesOn.toLowerCase() + "Name"]  ||
                editRequestBody?.[editRequestBody.appliesOn.toLowerCase() + "Name"] .trim().length === 0)
                ? "required*"
                : editRequestBody?.[editRequestBody.appliesOn.toLowerCase() + "Name"] ?.length! > 30
                ? "Plaese enter length less than 30 character"
                : ""
            }
          /> */}
                <Autocomplete
  multiple
  disableCloseOnSelect
  options={options}
  getOptionLabel={(option) => option.label}
  value={
    options.filter((opt) =>
      (editRequestBody?.[editRequestBody.appliesOn?.toLowerCase() + "Names"] || []).includes(opt.value)
    )
  }
  onChange={(_, newValues) => {
    if (!editRequestBody.appliesOn) return;
    const fieldName = editRequestBody.appliesOn.toLowerCase() + "Names";
    const selectedValues = newValues.map((v) => v.value);

    setEditRequestBody({
      ...editRequestBody,
      [fieldName]: selectedValues,
    });
    setCheck(true);
  }}
  renderOption={(props, option, { selected }) => (
    <li {...props}>
      <Checkbox
        icon={icon}
        checkedIcon={checkedIcon}
        style={{ marginRight: 8 }}
        checked={selected}
      />
      {option.label}
    </li>
  )}
  renderInput={(params) => (
    <TextField
      {...params}
      size="small"
      placeholder={`Enter ${appliesOnConfig?.find(item => item.id.toLowerCase() === editRequestBody.appliesOn?.toLowerCase())?.label || ""} Name(s)`}
      error={
        ((editRequestBody?.[editRequestBody.appliesOn?.toLowerCase() + "Names"]?.length === 0 ||
          !editRequestBody?.[editRequestBody.appliesOn?.toLowerCase() + "Names"]) &&
          error)
      }
      helperText={
        error &&
        (!editRequestBody?.[editRequestBody.appliesOn?.toLowerCase() + "Names"] ||
          editRequestBody?.[editRequestBody.appliesOn?.toLowerCase() + "Names"].length === 0)
          ? "required*"
          : ""
      }
    />
  )}
/>



          </>
          }

            
          </>

          
          }
          <label className="create-basket-input-labels">  {translate(TranslationEnum.manage_basket,"BASKET TITLE")}</label>
          <TextField
            id="outlined-start-adornment"
            size="small"
            placeholder={translate(TranslationEnum.manage_basket,"Enter Basket Title")}
            value={editRequestBody?.title}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <FontAwesomeIcon icon={faPen} />
                </InputAdornment>
              ),
            }}
            onChange={(event) => {
              setEditRequestBody({
                ...editRequestBody,
                title: event.target.value,
              });
              setCheck(true);
            }}
            error={
              ((!showSbuFilelds && (!editRequestBody?.title ||
                editRequestBody?.title.trim().length === 0) &&
                error) ||
              editRequestBody?.title?.length! > 30)
            }
            helperText={
              error &&
              (!editRequestBody?.title ||
                editRequestBody?.title.trim().length === 0) && !showSbuFilelds
                ? "required*"
                : editRequestBody?.title?.length! > 30
                ? "Plaese enter length less than 30 character"
                : ""
            }
          />
          <div className="create-basket-input-labels">
            <span>{translate(TranslationEnum.manage_basket,"TITLE COLOR")}</span>
            <Switch
              onChange={() => {
                setTitleColor(!titleColor);
                setCheck(true);
              }}
              checked={titleColor}
              offColor="#000000"
              onColor="#ffffff"
              onHandleColor="#000000"
              offHandleColor="#ffffff"
              size={22}
              handleDiameter={19}
              uncheckedIcon={
                <>
                  <div className="create-checked-color-status">{translate(TranslationEnum.manage_basket,"BLACK")}</div>
                </>
              }
              checkedIcon={
                <>
                  <div className="create-unchecked-color-status">{translate(TranslationEnum.manage_basket,"WHITE")}</div>
                </>
              }
              height={23}
              width={65}
              className="create-basket-color-switch"
            />
          </div>

          <label className="create-basket-input-labels">{translate(TranslationEnum.manage_basket,"SUBTITLE")}</label>
          <TextField
            id="outlined-start-adornment"
            size="small"
            placeholder={translate(TranslationEnum.manage_basket,"Enter Basket Subtitle")}
            value ={editRequestBody?.subtitle}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <FontAwesomeIcon icon={faPen} />
                </InputAdornment>
              ),
            }}
            onChange={(event) => {
              setEditRequestBody({
                ...editRequestBody,
                subtitle: event.target.value,
              });
              setCheck(true);
            }}
            error={editRequestBody?.subtitle?.length! > 50}
            helperText={
              editRequestBody?.subtitle?.length! > 50
                ? "Please enter length less than 50 characters"
                : ""
            }
          />
          <div className="create-basket-input-labels">
            <span>{translate(TranslationEnum.manage_basket,"SUBTITLE COLOR")}</span>
            <Switch
              onChange={() => {
                setSubTitleColor(!subTitleColor);
                setCheck(true);
              }}
              checked={subTitleColor}
              offColor="#000000"
              onColor="#ffffff"
              onHandleColor="#000000"
              offHandleColor="#ffffff"
              size={22}
              handleDiameter={19}
              uncheckedIcon={
                <>
                  <div className="create-checked-color-status">{translate(TranslationEnum.manage_basket,"BLACK")}</div>
                </>
              }
              checkedIcon={
                <>
                  <div className="create-unchecked-color-status">{translate(TranslationEnum.manage_basket,"WHITE")}</div>
                </>
              }
              height={23}
              width={65}
              className="create-basket-color-switch"
            />
          </div>

          {showSbuFilelds && 
          <><label className="create-basket-input-labels">{translate(TranslationEnum.manage_basket,"SEE ALL PRODUCTS TEXT COLOR")}</label>
          <TextField
            id="outlined-start-adornment"
            size="small"
            value={editRequestBody ? editRequestBody?.allProductsTextColor : "#000000"}
            placeholder={"#000000"}
            onChange={(e) => {
              handleColorChange(e, "allProductsTextColor");
            }}
            // disabled={ editRequestBody?.tag === ""}
            InputProps={{
              endAdornment: (
                <input
                  type="color"
                  id="color-picker"
                  value={editRequestBody?.allProductsTextColor}
                  onChange={(e) => {
                    handleColorChange(e, "allProductsTextColor");
                  }}
                  // disabled={ editRequestBody?.tag === ""}
                />
              ),
            }}
            error={
              editRequestBody?.allProductsTextColor
                ? !isValidHexColor(editRequestBody?.allProductsTextColor)
                : false
            }
            helperText={
              editRequestBody?.allProductsTextColor
                ? !isValidHexColor(editRequestBody?.allProductsTextColor)
                  ? "Please eneter a valid hex color value"
                  : ""
                : ""
            }
          />
          <label className="create-basket-input-labels">{translate(TranslationEnum.manage_basket,"SEE ALL PRODUCTS BAR COLOR")}</label>
          <TextField
            id="outlined-start-adornment"
            size="small"
            value={editRequestBody ? editRequestBody?.allProductsBarColor : "#000000"}
            placeholder={"#000000"}
            onChange={(e) => {
              handleColorChange(e, "allProductsBarColor");
            }}
            // disabled={ editRequestBody?.tag === ""}
            InputProps={{
              endAdornment: (
                <input
                  type="color"
                  id="color-picker"
                  value={editRequestBody?.allProductsBarColor}
                  onChange={(e) => {
                    handleColorChange(e, "allProductsBarColor");
                  }}
                  // disabled={ editRequestBody?.tag === ""}
                />
              ),
            }}
            error={
              editRequestBody?.allProductsBarColor
                ? !isValidHexColor(editRequestBody?.allProductsBarColor)
                : false
            }
            helperText={
              editRequestBody?.allProductsBarColor
                ? !isValidHexColor(editRequestBody?.allProductsBarColor)
                  ? "Please eneter a valid hex color value"
                  : ""
                : ""
            }
          />
          </>
          }

          {!showSbuFilelds && 
          <><label className="create-basket-input-labels">{translate(TranslationEnum.manage_basket,"BASKET TAG NAME")}</label>
          <TextField
            id="outlined-start-adornment"
            size="small"
            placeholder={translate(TranslationEnum.manage_basket,"Select Basket Tag Name")}
            value={editRequestBody?.tag}
            disabled={disableColorPicker}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <FontAwesomeIcon icon={faPen} />
                </InputAdornment>
              ),
            }}
            onChange={(event) => {
              setEditRequestBody({
                ...editRequestBody,
                tag: event.target.value,
              });
              setCheck(true);
            }}
            error={editRequestBody?.tag?.length! > 15}
            helperText={
              editRequestBody?.tag?.length! > 15
                ? "Please enter length less than 15 characters"
                : ""
            }
          />
          <label className="create-basket-input-labels">{translate(TranslationEnum.manage_basket,"BASKET TAG COLOR")}</label>
          <TextField
            id="outlined-start-adornment"
            size="small"
            value={editRequestBody ? editRequestBody?.tagColor : "#000000"}
            placeholder={"#000000"}
            onChange={(e) => {
              handleColorChange(e, "tagColor");
            }}
            disabled={disableColorPicker || editRequestBody?.tag === ""}
            InputProps={{
              endAdornment: (
                <input
                  type="color"
                  id="color-picker"
                  value={editRequestBody?.tagColor}
                  onChange={(e) => {
                    handleColorChange(e, "tagColor");
                  }}
                  disabled={disableColorPicker || editRequestBody?.tag === ""}
                />
              ),
            }}
            error={
              editRequestBody?.tagColor
                ? !isValidHexColor(editRequestBody?.tagColor)
                : false
            }
            helperText={
              editRequestBody?.tagColor
                ? !isValidHexColor(editRequestBody?.tagColor)
                  ? "Please eneter a valid hex color value"
                  : ""
                : ""
            }
          />
          </>
          }
          <div className="create-basket-input-labels">
            <span>{translate(TranslationEnum.manage_basket,"BASKET BACKGROUND")}</span>
            <Switch
              onChange={() => {
                setColorSwitch(!colorSwitch);
              }}
              checked={colorSwitch}
              offColor="#237c9d"
              onColor="#24c6b1"
              size={22}
              handleDiameter={19}
              uncheckedIcon={
                <>
                  <div className="create-unchecked-icon-status">{translate(TranslationEnum.manage_basket,"IMAGE")}</div>
                </>
              }
              checkedIcon={
                <>
                  <div className="create-checked-icon-status">{translate(TranslationEnum.manage_basket,"COLOUR")}</div>
                </>
              }
              height={23}
              width={65}
              className="create-basket-switch"
            />
          </div>
          {colorSwitch ? (
            <TextField
              id="outlined-start-adornment"
              size="small"
              value={
                editRequestBody?.backGroundColor
                  ? editRequestBody.backGroundColor
                  : ""
              }
              placeholder={"#ffffff"}
              onChange={(e) => {
                handleColorChange(e, "backGroundColor");
              }}
              InputProps={{
                endAdornment: (
                  <input
                    type="color"
                    id="color-picker"
                    value={
                      editRequestBody?.backGroundColor
                        ? editRequestBody.backGroundColor
                        : "#ffffff"
                    }
                    onChange={(e) => {
                      handleColorChange(e, "backGroundColor");
                    }}
                  />
                ),
              }}
              error={
                editRequestBody.backGroundColor
                  ? !isValidHexColor(editRequestBody.backGroundColor)
                  : false
              }
              helperText={
                editRequestBody.backGroundColor &&
                !isValidHexColor(editRequestBody.backGroundColor)
                  ? "Please enter a correct hex value"
                  : ""
              }
            />
          ) : (
            <UploadImageButton
              label={""}
              imageState={{
                imageFile: backGroundImage,
                setImageFile: setBackGroundImage,
              }}
              defaultImage={editRequestBody?.backgroundImageBlobKey}
              editRequest={{ editRequestBody, setEditRequestBody }}
              setCheck={setCheck}
              openPopUp={openPopUp}
              blobName={"backgroundImageBlobKey"}
              error={showSbuFilelds && error}
              resolution={{ height: showSbuFilelds?350:500, width: showSbuFilelds?460:600 }}
            />
          )}
           <div className="create-basket-input-labels">
            <span>{translate(TranslationEnum.manage_basket,"ADD TO CART")}</span>
            <Switch
              onChange={(checked) => {
                setEditRequestBody({
                  ...editRequestBody,
                  addToCart: checked ,
                });
                setCheck(true);
              }}
              checked={Boolean(editRequestBody.addToCart)}
              offColor="#237c9d"
              onColor="#24c6b1"
              size={24}
              handleDiameter={19}
              uncheckedIcon={
                <>
                  <div className="create-checked-cart-status">{translate(TranslationEnum.manage_basket,"DISABLED")}</div>
                </>
              }
              checkedIcon={
                <>
                  <div className="create-unchecked-cart-status">{translate(TranslationEnum.manage_basket,"ENABLED")}</div>
                </>
              }
              height={23}
              width={65}
              className="create-basket-color-switch"
            />
          </div>
          <UploadImageButton
            label={translate(TranslationEnum.manage_basket,"DISPLAY IMAGE(Right)")}
            imageState={{
              imageFile: displayImage,
              setImageFile: setDisplayImage,
            }}
            defaultImage={editRequestBody?.displayImageBlobKey}
            editRequest={{ editRequestBody, setEditRequestBody }}
            setCheck={setCheck}
            openPopUp={openPopUp}
            blobName={"displayImageBlobKey"}
            error={false} // mot mandatory
            resolution={{ height: 128, width: 128 }}
          />
          <UploadImageButton
            label={translate(TranslationEnum.manage_basket,"BASKET ICON (Left)")}
            imageState={{
              imageFile: basketTitleIcon,
              setImageFile: setbasketTitleIcon,
            }}
            defaultImage={editRequestBody?.basketTitleIconBlobKey}
            editRequest={{ editRequestBody, setEditRequestBody }}
            setCheck={setCheck}
            openPopUp={openPopUp}
            blobName={"basketTitleIconBlobKey"}
            error={!showSbuFilelds && error}
            resolution={{ height: 128, width: 128 }}
          />
          <button
            className={
              true || check
                ? "create-basket-submit create-basket-submit-active"
                : "create-basket-submit"
            }
            onClick={() => {
              console.log("Submit button clicked, showLoader:", showLoader);
              if (true || check) {
                setShowLoader(true);
                console.log("About to call uploadBasketData, !showLoader:", !showLoader);
                !showLoader && uploadBasketData();
              }
            }}
          >
            {showLoader ? (
              <div>
                <CircularProgress size={15} color="inherit" />
                <span className="circular-progress-container ">{translate(TranslationEnum.common_portal,"SUBMIT")}</span>
              </div>
            ) : (
              <>{translate(TranslationEnum.common_portal,"SUBMIT")}</>
            )}
          </button>

          </>
        }
        </div>
        <GenericPopUp
          type={genericModaltype}
          message={genericModalMessage}
          openGenericModal={genericModalState}
          setOpenGenericModal={() => {
            setGenericModalState(false);
          }}
        />
      </div>
    </>
  );
};

export default CreateBasket;
