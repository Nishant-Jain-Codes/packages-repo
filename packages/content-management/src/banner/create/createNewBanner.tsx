// @ts-nocheck
import { Autocomplete, AutocompleteCloseReason, Box, Button, CircularProgress, Paper, Stack, TextField, Typography, FormControlLabel, Switch } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import React, { ChangeEvent, SyntheticEvent, useEffect, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import '../components/CreateBanner.css';
import { Banner, bannerMockData, BannerTemplate, configurationAttributeType, getNewMetaDataConfig, languageOptions, transformFromSaleshubPayload, transformToSaleshubPayload } from '@/utils/UtilityService';
import { fetchAllBaskets, fetchAllSKUcodes, fetchNewSchemesOptions, fetchProductFiltersOptions, fetchSchemesOptions, getAllBanners, getConfigFromClientConfig, getFinalBannerTemplates, getGlobalFilters, getSalesHubUniqueProductCategories, getUniqueProductCategories, makeBannerDistributionData, sendBannerDistribution, uploadImages, validateBannerResponse, validateGoogleUrl, validateYoutubeUrl } from '../../services/bannerServices';
import { GenericPopUp } from '@/components/popup/genericPopUp';
import { popupType } from '@/types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useContentManagementConfig } from '@/provider';
import { bannerData, bannerDescriptionKeys, bannerDescriptionState, bannerElementExtendedAttributes, bannerElementState, bannerfilterConfigObj, bannerLocationState, bannerProductFilterMappingObj, bannerV2DataPayload, categoryElementComponents, CreateBannerProps, languageBannerState, mediaNameIdType, productParam} from '@/features/content-management/banner/create/bannerTypes';
// import GenericFilters from '../../components/genericFilters/genericFilters';
import { getCurrentGlobalFilterObject } from '@/utils/UtilityService';
import { validateWithOtp } from '@/utils/validateOtpPopupActions';
import { openPopup } from '@/utils/UtilityService';
import { manageUpdateAccessObj } from '@/utils/UtilityService';
import { getMetaDataConfig } from '@/utils/UtilityService';
import { defaultOptions } from '@/utils/UtilityService';
import BannerLanguageSelection from '@/features/content-management/banner/components/BannerLanguageSelection';
import BannerElements from '@/features/content-management/banner/components/BannerElements';
// import { deepClone } from '@mui/x-data-grid/utils/utils';
import cloneDeep from 'lodash/cloneDeep';
import { Loader } from '@/components/loader/Loader';
import { setBannerUpdateStatus } from '@/features/content-management/state/bannerActions';
import { useTranslation } from 'react-i18next';
import { TranslationEnum, usePortalTranslation } from '@/utils/TranslationProvider';
import BackButton from '@/utils/BackButton';
// import MarketDetailsSelector from '../manageCoupons/components/DefineCoupon/MarketDetails/MarketDetailsSelector';
import { DB_COLUMN_NAME_MAP_COLUMN_NAME } from '@/utils/couponMarketDetailsUtils';
import {  getMarketDetailsOptions, getMarketTabsList, getOutletTabsList } from '@/utils/couponMarketDetailsUtils';
import {  getEntityPriority } from '@/utils/couponMarketDetailsUtils';
import { useSelector } from 'react-redux';
import { getAvailableBlockOptionsOfTypeNew, getBlockMetaData, getClientConfigDomainType, getConfigKeyValue, getLinkedBlock, getUpdatedRoleAppLayoutConfig, updateWholeSellerConfiguration } from '../../services/manageHomeScreenService';
import { BlockObjType, BlockSelectionState, retailerAppLayoutConfigObj } from '@/features/content-management/block/create/CreateBlockTypes';
import { defaultBlockObj } from '@/features/content-management/block/create/BlockType';
import { getLob } from '@/utils/UtilityService';
import { BannerContext } from './BannerContext';
import { defaultBannerConfig } from '@/features/content-management/banner/manage/defaultBannerConfig';
import { bannerProductFilterMapping, bannerTemplates } from './bannerTemplates';
import { Card, CardMedia } from "@mui/material";
const image1 = "";
const image2 = "";
const image3 = "";
const image4 = "";
const image5 = "";
const image6 = "";
import BannerElementsNew from './BannerElementsNew';
import { OptionType } from '@/utils/UtilityService';
import { ChannelkartNetworkGet, defaultTokenNew } from '@/utils/networkServiceSimple';
const resolutionMapping = [
    { resolution: "1024 X 376", id: "template1" },
    { resolution: "1024 X 376", id: "template2" },
    { resolution: "1024 X 376", id: "template22" },
    { resolution: "1024 X 376", id: "template24" },
    { resolution: "1024 X 376", id: "template25" },
    { resolution: "1024 X 376", id: "template26" },
    { resolution: "1024 X 376", id: "template27" },
    { resolution: "1024 X 376", id: "template30" },
    { resolution: "1024 X 376", id: "template35" },
    { resolution: "1024 X 376", id: "template36" },
    { resolution: "1024 X 376", id: "template38" },
    { resolution: "1024 X 376", id: "template39" },
    { resolution: "1024 X 376", id: "template33" },
    { resolution: "500 X 416", id: "template3" },
    { resolution: "500 X 416", id: "template28" },
    { resolution: "500 X 416", id: "template34" },//promo
    { resolution: "1000 X 400", id: "template19" },
    { resolution: "1024 X 400", id: "template14" },
    { resolution: "1000 X 400", id: "template19" },
    { resolution: "1024 X 400", id: "template15" },
    { resolution: "1024 X 400", id: "template16" },
    { resolution: "1024 X 400", id: "template17" },
    { resolution: "1024 X 400", id: "template21" },
    { resolution: "300 X 420", id: "template29" },
    { resolution: "210 X 240", id: "template999" },
    { resolution: "1024 X 270", id: "template31" },
    { resolution: "1024 X 572", id: "template20" },
    { resolution: "1024 X 572", id: "template32" },
    { resolution: "1024 X 270", id: "template1234" },

];

export const defaultBannerTemplate: BannerTemplate = { label: "", options: [], id: "", resolution: { height: "0", width: "0"}};
interface basketInterface {id: string, tag: string, type: string, title: string, tagColor: string };

const defaultSelectedBucket = { id: "" , title: "" };
const allLanguageOption: languageOptions = {
    language: "All",
    code: "All",
    origin: "All"
}
const CUR_COMPONENT = "Manage Banner";
const CUR_COMPONENT_COMMON="commonPortal";
interface BannerOption {
    label: string;
    imgSrc: string | null;
    resolution:any;
  }
  
//   const bannerOptions: BannerOption[] = [
//     { 
//         label: "1024 X 376", 
//         imgSrc: image2,
//         resolution: { width: 1024, height: 376 } 
//     },
//     { 
//         label: "500 X 416", 
//         imgSrc: image6, 
//         resolution: { width: 500, height: 416 }
//     },
//     { 
//         label: "1024 X 270", 
//         imgSrc: image1, 
//         resolution: { width: 1024, height: 270 }
//     },
//     { 
//         label: "300 X 420", //
//         imgSrc: image5, 
//         resolution: { width: 300, height: 420 }
//     },
//     { 
//         label: "1024 X 572", //
//         imgSrc: image4, 
//         resolution: { width: 1024, height: 572 }
//     },
//     { 
//         label: "1024 X 400", 
//         imgSrc: image3, 
//         resolution: { width: 1024, height: 400 }
//     }
// ];

function CreateNewBanner(props: CreateBannerProps) {
  const [useBeta, setUseBeta] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<any>({
    label: "",
    imgSrc: null,
    resolution: { width: 0, height: 0 }
});
  const { translate } = usePortalTranslation();  
  const location = useLocation();
  const navigate = useNavigate();
  const { routes } = useContentManagementConfig();
//   const locationState: bannerLocationState  = location.state as bannerLocationState;
  const locationState: any  = location.state as any;
  const [isEdit,setIsEdit] = React.useState<boolean>(false);
  const [genericFilter,setGenericFilter] = React.useState<any[]>([]);
  const [checkErrors,setCheckErrors] = React.useState<boolean>(false);
  const [categories,setCatgories] = React.useState<string[]>([]);
  const numberInWords = ['One','Two','Three','Four', 'Five'];
  const [isBankingBanner,setIsBankingBanner] = React.useState<boolean>(false);
  const [bankName,setBankName] = React.useState<string>("");
  const [showLoader,setShowLoader] = React.useState<boolean>(false);
  const [baskets,setBaskets] = React.useState<string[]>([]);
  const [brands,setBrands] = React.useState<string[]>(["test1","test2"]);
  const [basketObjects, setBasketObjects] = React.useState<basketInterface[]>([]);
  const [resetFiltersFlag, setResetFiltersFlag] = React.useState<boolean>(false);
  const basketDataRef = useRef<basketInterface[]>([]);
  const bucketConfigRef = useRef<any>([]);
  const [availableBucketOptions,setAvailableBucketOptions] = React.useState<any>([]);
  const [selectedBucket,setSelectedBucket] = React.useState<any>(defaultSelectedBucket);
  const prevLinkedBucketRef = useRef<any>(defaultSelectedBucket);
  const bannerConfigRef = useRef<any>([]);
  const availableLanguagesRef = useRef<languageOptions[]>([]);
  const clientConfigRef = useRef<any[]>([]);
  const [pageLoader,setPageLoader] = useState<boolean>(false);
  const [schemesLoader,setSchemesLoader] = useState<boolean>(false);
  const [bannerTemplateOptions,setBannerTemplateOptions] = useState<BannerTemplate[]>([]);
  const [couponFilter,setCouponFilter] = useState<string>("");
  const [mappedBanner,setMappedBanner] = useState<boolean>(false);
  const {marketLevelTabsList,outletLevelTabsList} = useSelector((state:any)=>state?.manageCoupons?.configData);
  const allBlocksRef = useRef<any[]>([]);
  const [blockSelectionState,setBlockSelectionState] = useState<BlockSelectionState>({
    selectedBlock: defaultBlockObj,
    blockOptions: [],
    blockConfigEnabled: false,
    isChanged: false
  })
  const savedRole:any = useSelector((state: any) => state.roleState.role)
const [roleOptions, setRoleOptions] = useState<OptionType[]>([]);
const [isMapped, setIsMapped] = useState<boolean>(false);
const [saleshubPostAPI, setSaleshubPostAPI] = useState<boolean>(false);
const [useSaleshub, setUseSaleshub] = useState<boolean>(false);
console.log("roleOptions",roleOptions)

  const [startDate, setStartDate] = React.useState<Dayjs | null>(
    null
  );

  let previousDate = new Date();
  previousDate.setDate((new Date()).getDate() - 1);
  const prevDate = dayjs(previousDate).format("YYYY-MM-DD");

const [endDate, setEndDate] = React.useState<Dayjs | null>(
    null
  );

// const [bannerTemplateType, setbannerTemplateType] = React.useState<BannerTemplate | null >(defaultBannerTemplate);     
const [languageBannerState,setlanguageBannerState] = useState<languageBannerState>({})
const [selectedLanguageTab,setSelectedLanguageTab] = useState<number>(0)

const [bannerDescription, setBannerDescription] = React.useState<bannerDescriptionState>({});

const [openGenericModal,setOpenGenericModal] = React.useState<boolean>(false);
const [popupMessage,setPopupMessage] = React.useState<string>("");
const [popupType,setPopupType] = React.useState<popupType>("Alert");
const defaultLanguageBannerStateRef = useRef<languageBannerState>({});
const [dateValidation,setDateValidation] = useState({ startDate: "", endDate: "" })
console.log("availableBucketOptions",availableBucketOptions)
const [selectedBannerBehaviour, setSelectedBannerBehaviour] = useState<any>( { label: "", id: ""});
const defaultBannerBehaviourOption = [
    { label: "Auto Play Video", id: "tvAdds" },
    { label: "Bucket Linked Banners", id: "bucketBanner" },
    { label: "Image", id: "banner" },
    { label: "Toggle Banner", id: "toggleBanner" }
];
const [bannerBehaviourOption, setBannerBehaviourOption] = useState(defaultBannerBehaviourOption);
const bannerOptions: BannerOption[] = selectedBannerBehaviour?.id === "bucketBanner" ? [
    { 
        label: "300 X 420", //
        imgSrc: image5, 
        resolution: { width: 300, height: 420 }
    },
    { 
        label: "210 X 240", //
        imgSrc: image5, 
        resolution: { width: 210, height: 240 }
    },
    { 
        label: "1024 X 572", //
        imgSrc: image4, 
        resolution: { width: 1024, height: 572 }
    }
]: [
    { 
        label: "1024 X 376", 
        imgSrc: image2,
        resolution: { width: 1024, height: 376 } 
    },
    { 
        label: "500 X 416", 
        imgSrc: image6, 
        resolution: { width: 500, height: 416 }
    },
    { 
        label: "1024 X 270", 
        imgSrc: image1, 
        resolution: { width: 1024, height: 270 }
    },
    { 
        label: "1024 X 400", 
        imgSrc: image1, 
        resolution: { width: 1024, height: 400 }
    },
    { 
        label: "1000 X 400", 
        imgSrc: image1, 
        resolution: { width: 1000, height: 400 }
    }
];
const allBannersRef = useRef<Banner[] | null>(null);
const handleBannerBehaviour = (event:SyntheticEvent,value: any) => {
    //
    setSelectedBucket(defaultSelectedBucket)
    setBlockSelectionState((prevState) => {
        return { ...prevState, selectedBlock: defaultBlockObj}
    })
    setSelectedBannerBehaviour(value)
    if(value.id==="tvAdds"){
        setSelectedOption({label:"tvAdds",resolution: { width: 0, height: 0 }})
    }else if(value.id==="toggleBanner"){
        setSelectedOption({label:"toggleBanner",resolution: { width: 1024, height: 270 }})
    }else{
        setSelectedOption({
            label: "",
            imgSrc: null,
            resolution: { width: 0, height: 0 }
        })
    }
    if(value.id==="bucketBanner"){
        const needBasedBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "Need Based Basket Banner");
        const oneClickBasketBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "basketBannerOneClick");
        const campaignBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "campaignBanner");
        const allBuckets = [...needBasedBuckets, ...oneClickBasketBuckets, ...campaignBuckets]
        const allBanners = allBannersRef.current;
        //
    if (allBanners) {
  const filteredBuckets = allBuckets.filter((bucket) => {
    if (!bucket.bannerIds || bucket.bannerIds?.length === 0) {
      return true;
    }
    const matchingBanners = bucket.bannerIds?.map((bannerId: any) =>
      allBanners.find((b: any) => b.id === bannerId)
    );
    if (matchingBanners.every((banner:any) => !banner)) {
      return true;
    }
    const validBanners = matchingBanners.filter((banner:any) => banner !== null && banner !== undefined);

    if (validBanners?.length === 0) {
      return true; 
    }
    const allBannersHaveV2 = validBanners.every((banner:any) => 
      banner?.extendedAttributes?.bannerV2
    );
    return allBannersHaveV2;
  });

  setAvailableBucketOptions(filteredBuckets);
}

    }
    resetAll();
  }
console.log("selectedBlock",blockSelectionState.selectedBlock)
    useEffect(() => {
    const fetchPortalConfig = async () => {
      const portalConfig = await getNewMetaDataConfig(
        "portal_configuration"
      );
      const portal_config: configurationAttributeType[] =
        portalConfig?.domainValues ?? [];
      const mappedConfig = portal_config.find((item: { name: string; }) => item.name === "mappedBanner");
      if (mappedConfig) {
        setMappedBanner(mappedConfig.value ?? false)
      }
      const saleshubPostAPI = portal_config?.find(
        (item) => item.name === "saleshubPostAPI"
      )?.value ?? false;
      setSaleshubPostAPI(saleshubPostAPI);
      const useSalesHub = portal_config?.find(
        (item) => item.name === "useSaleshub"
      )?.value ?? false;
      setUseSaleshub(useSalesHub);
    };
    fetchPortalConfig();
  }, []);
useEffect(() => {
    //
    if(selectedOption?.label){
        // const templateFilteredBlocks = allBlocksRef.current.filter((blockObj) => blockObj.bannerType === bannerTemplateType.id);
        const templateFilteredBlocks = getAvailableBlockOptionsOfTypeNew("Banner",allBlocksRef.current,selectedOption.label);
        const locationStateBanner: bannerData | undefined = locationState?.currentBanner;
        let linkedBlock = blockSelectionState.selectedBlock;
        if(locationStateBanner?.id && Object.keys(locationStateBanner)?.length !== 0){
            linkedBlock = getLinkedBlock(allBlocksRef.current,"Banner",locationStateBanner.id) ?? linkedBlock;
        }
        //
        setBlockSelectionState((prevState) => {
            return {
                ...prevState,
                blockOptions: templateFilteredBlocks,
                selectedBlock: linkedBlock
            }
        })
    }
},[selectedOption,savedRole,allBlocksRef.current])

useEffect(() => {
    const fetchBanners = async () => {
        
        const portalConfig = await getNewMetaDataConfig(
            "portal_configuration"
        );
        const portal_config: configurationAttributeType[] =
            portalConfig?.domainValues ?? [];
        const useSalesHubAPI = portal_config?.find(
            (item) => item.name === "useSaleshub"
        )?.value ?? false;
        let allBanners;
        if (useSalesHubAPI) {
            // Fetch from Saleshub API
            try {
                const resp = await fetch('https://api.salescodeai.com/banners', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': localStorage.getItem("auth_token") || defaultTokenNew,
                    },
                });
                if (resp.ok) {
                    const saleshubData = bannerMockData.length>0 ? bannerMockData : await resp.json();
                    // If API returns array, transform each
                    allBanners = transformFromSaleshubPayload(saleshubData);

                } else {
                    allBanners = [];
                }
            } catch (e) {
                allBanners = [];
            }
        } else {
            allBanners = (await getAllBanners()) as Banner[];
        }
        allBannersRef.current = allBanners;
    };
    fetchBanners();
  }, []);
  function setElementWRTmedia(element:bannerElementState,newLanguageBannerState: languageBannerState,bannerTemplate: BannerTemplate | undefined,languageCode: string){
    if(element?.extendedAttributes?.bannerPriority){
        element.bannerPriority = element?.extendedAttributes?.bannerPriority;
    }
    Reflect.deleteProperty(element, 'createdBy');
    Reflect.deleteProperty(element, 'modifiedBy');
    Reflect.deleteProperty(element, 'creationTime');
    Reflect.deleteProperty(element, 'lastModifiedTime');
    Reflect.deleteProperty(element, 'lob');
    Reflect.deleteProperty(element, 'id');
    Reflect.deleteProperty(element, 'activeStatus');
    Reflect.deleteProperty(element, 'activeStatusReason');
    Reflect.deleteProperty(element, 'version');
    Reflect.deleteProperty(element, 'source');
    Reflect.deleteProperty(element, 'changes');
    Reflect.deleteProperty(element, 'changed');
    Reflect.deleteProperty(element, 'extendedAttributes');
    Reflect.deleteProperty(element, 'create');
    const elementStateIndex = element.elementNumber? parseInt(element.elementNumber) - 1 : -1;
    switch(element.mediaName){
        case "communication": {
            element.elementComponents = element.elementComponents  as string
            const elementComponents = element.elementComponents? JSON.parse(element.elementComponents)[0] : {};
            Reflect.deleteProperty(element, 'elementComponents');
            const additionalBlobKey = elementComponents.extendedAttributes.blobKey;
            const additionalFileType = elementComponents.extendedAttributes.fileType;
            const additionalFileName = elementComponents.extendedAttributes.fileName;
            if(elementStateIndex!== -1) newLanguageBannerState[languageCode][elementStateIndex] = {...element,additionalBlobKey,additionalFileName,additionalFileType};
            break;
        }
        case "CategoryImage": {
            element.elementComponents = element.elementComponents  as string
            const elementComponents = JSON.parse(element.elementComponents)[0];
            const category = elementComponents.extendedAttributes.category;
            Reflect.deleteProperty(element, 'elementDescription');
            if(elementStateIndex!== -1) newLanguageBannerState[languageCode][elementStateIndex] = {...element,category};
            break;
        }
        case "ImageWithBasketId": {
            element.elementComponents = element.elementComponents as string
            const elementComponents = JSON.parse(element.elementComponents)[0];

            const basketId = elementComponents.extendedAttributes.basketId;
            const brand = elementComponents.extendedAttributes.brand;
            let basket = '';
            const basketData = basketDataRef.current;
            for(let i=0;i<basketData?.length;i++){
                if(basketData[i].id === basketId){
                    basket = basketData[i].title;
                    break;
                }
            }
            Reflect.deleteProperty(element, 'elementDescription');
            if(elementStateIndex!== -1) newLanguageBannerState[languageCode][elementStateIndex] = {...element,basket,brand};
            break;
        }
        case "youtubeLink": {
            Reflect.deleteProperty(element, 'elementComponents');
            Reflect.deleteProperty(element, 'fileName');
            Reflect.deleteProperty(element, 'blobKey');
            Reflect.deleteProperty(element, 'elementDescription');

            if(elementStateIndex!== -1) newLanguageBannerState[languageCode][elementStateIndex] = {...element};            
            break;
        }
        case "redirectToPage": {
            //
            const elementComponents = element.elementComponents as { redirection: string };

            const redirection = elementComponents?.redirection ?? "";
            Reflect.deleteProperty(element, 'elementDescription');
            if(elementStateIndex!== -1) newLanguageBannerState[languageCode][elementStateIndex] = {...element,redirection};
            break;
        }
        default: {
            //
            const elementComponents:categoryElementComponents| string | undefined = element.elementComponents as categoryElementComponents;
            Reflect.deleteProperty(element, 'elementComponents');
            if((element.mediaName === "youtubeLinkWithProducts" || element.mediaName === "imageWithProducts") && elementComponents && element.elementNumber){
                const wordNum = numberInWords[parseInt(element.elementNumber)-1];
                const mediaNameId: mediaNameIdType = "mediaName" + wordNum.charAt(0).toLowerCase() + wordNum.slice(1) as mediaNameIdType;
                const productFilterStates: {[key in productParam | "selectedSKUcodes"]?: string[]} = {};
                bannerProductFilterMapping.forEach((filter: bannerProductFilterMappingObj) => {
                    if(elementComponents[`${filter.value}_${mediaNameId}`]){
                        productFilterStates[filter.id] = elementComponents[`${filter.value}_${mediaNameId}`];
                    }
                })
                if(elementStateIndex!== -1) newLanguageBannerState[languageCode][elementStateIndex] = {...element,...productFilterStates};
            }else{
                if(elementComponents?.schemeId){
                    element.mediaName = "imageWithSchemes"
                    const productFilterStates: {[key in productParam | "selectedSKUcodes"]?: string[]} = {};
                    productFilterStates["schemeId"] = elementComponents.schemeId
                    if(elementStateIndex!== -1) newLanguageBannerState[languageCode][elementStateIndex] = {...element,...productFilterStates};
                }else if(elementComponents?.redirection){
                    const redirection = elementComponents?.redirection ?? "";
                    if(elementStateIndex!== -1) newLanguageBannerState[languageCode][elementStateIndex] = {...element,redirection};
                }else{
                    const additionalBlobKey = elementComponents?.additionalBlobKey ?? "";
                    const additionalTogglePosition = elementComponents?.additionalTogglePosition ?? "";
                    if(elementStateIndex!== -1) newLanguageBannerState[languageCode][elementStateIndex] = {...element,additionalBlobKey,additionalTogglePosition};
                    // if(elementStateIndex!== -1) newLanguageBannerState[languageCode][elementStateIndex] = {...element};
                }
            }
        }
    }
}
  useEffect(() => {
    
      async function getAllBrands() {
          try {
              let response;
              const portalConfig = await getNewMetaDataConfig(
                  "portal_configuration"
              );
              const portal_config: configurationAttributeType[] =
                  portalConfig?.domainValues ?? [];
              const useSalesHubAPI = portal_config?.find(
                  (item) => item.name === "useSaleshub"
              )?.value ?? false;
              if (useSalesHubAPI) {
                  response = await ChannelkartNetworkGet(`https://api.salescodeai.com/catalog/meta?type=brand&size=10000`, localStorage.getItem("auth_token") || defaultTokenNew);
              } else {
                  response = await ChannelkartNetworkGet(
                      "/v1/distinctFieldData/productDetails/brand?size=10000"
                  );
              }
              if (response.status === 200) {
                  const data = response.data;
                  let brandList;
                  if(useSalesHubAPI){
                    const fixedBrands=[
                        "Dabur Red Ultra Strong Balm",
                        "Honitus Cough drops",
                        "Honitus Syrup",
                        "Honitus Hot Sip",
                        "Honitus Syrup - Adulsa",
                        "Honitus Syrup - Sugar Free",
                        "Dabur Hingoli",
                        "Honitus Ayurvedic Lozenges",
                        "Pudin Hara Capsules",
                        "Pudin Hara Active",
                        "Pudin hara lemon fizz",
                        "Pudin Hara Fanto fizz",
                        "Ayush Kaadha",
                        "Ayush Kwath Kashayam",
                        "Mrit Sanjivani",
                        "Gripe Water",
                        "Janma Ghunti",
                        "Sanitize Antiseptic",
                        "Sanitize Plus Antiseptic",
                        "Dabur Himalayan Shilajit",
                        "Dabur Shilajit Gold",
                        "Dabur Shilajit",
                        "Dabur Sat Isabgol"
                      ];
                      brandList = [...fixedBrands, ...data.map((item: any) => item.name)];
                       const categoryData = await getSalesHubUniqueProductCategories();
                      const categoryOptions = categoryData?.map((option: { name: string }) => {
                          return option.name;
                      })
                      setCatgories(categoryOptions);
                      
                  }else{
                   brandList = data.map((item: { brand: any; }) => item.brand);
                      const categoryData = await getUniqueProductCategories();
                      const categoryOptions = categoryData?.map((option: { category: string }) => {
                          return option.category;
                      })
                      setCatgories(categoryOptions);
                  }
                  setBrands(brandList);
              } else {
                  setBrands([]);
              }
          } catch (error) {
              console.error("Failed to fetch brands data:", error);
          }
      }
    async function getAndSetClientConfig(){
        const clientConfig = await getNewMetaDataConfig();
        clientConfigRef.current = clientConfig;
    }
    async function getBannerBehaviourOption(){
        //
        const bannerConfig= getConfigFromClientConfig(clientConfigRef.current,"banner_configuration")?.[0]?.value;
        const bannerOptions = bannerConfig?.find((option: {name: string}) => {
            return option.name === "bannerBehaviourOptions"
        })
        if(bannerOptions && bannerOptions.value && bannerOptions?.value?.length>0){
            setBannerBehaviourOption(bannerOptions.value)
        }
    }
    const getAllBaskets = () => {
        const tempBasketObjects = fetchAllBaskets(clientConfigRef.current);
        const basketNames = [];
        for(let i=0;i<tempBasketObjects?.length;i++){
            basketNames[i] = tempBasketObjects[i].title;
        }
        setBaskets(basketNames);
        setBasketObjects(tempBasketObjects);
        basketDataRef.current = tempBasketObjects;
    }
    async function getAllCategories(){

    }
    function getAndSetAllNeedBasedBuckets(){
        const bucketConfig = getConfigFromClientConfig(clientConfigRef.current,"bucket_configuration");
        if(bucketConfig){
            bucketConfigRef.current = bucketConfig;
        }
    }
    async function getAndSetBannerConfig(){
        try{
            let bannerConfig = getConfigFromClientConfig(clientConfigRef.current,"banner_configuration")?.[0]?.value;
            if(!bannerConfig){
                bannerConfig = defaultBannerConfig[0]?.value;
            }
            const additionalFiltersConfig = bannerConfig.find((option: {name: string}) => {
                return option.name === "bannerElementProductFilters"
            }) ?? defaultBannerConfig[0].value.find((option: { name: string}) => { // if banner_configuration is present but bannerElementProductFilters key is not present
                return option.name === "bannerElementProductFilters"
            })
            let portalConfig = getConfigFromClientConfig(clientConfigRef.current, "portal_configuration");
            const useSalesHubAPI = portalConfig?.find(
                  (item) => item.name === "useSaleshub"
              )?.value ?? false;
            const additionalFiltersOptions = await Promise.all(additionalFiltersConfig.value?.map(async (option: bannerfilterConfigObj) => {
                const filterOptions = await fetchProductFiltersOptions(option.id,useSalesHubAPI);
                return {
                    ...option,
                    options: filterOptions
                }
            }))
            //
            const disableSchemeBanner = portalConfig?.find(
                (item: any) => item.name === "disableSchemeBanner"
            )?.value ?? false;
            let schemeFilter;
            if(useSalesHubAPI){
                schemeFilter = await fetchNewSchemesOptions(disableSchemeBanner);
            } else {
                schemeFilter = await fetchSchemesOptions(disableSchemeBanner);
            }
            setSchemesLoader(false);
            const skuParamConfig = bannerConfig.find((option: { name: string} ) => {
                return option.name === "skuCodeFilterParam";
            }) ?? defaultBannerConfig[0].value.find((option: { name: string} ) => {
                return option.name === "skuCodeFilterParam";
            })
            const languageBasedBanner = bannerConfig.find((option: { name: string} ) => {
                return option.name === "languageBasedBanner";
            })?.value ?? defaultBannerConfig[0].value.find((option: { name: string} ) => {
                return option.name === "languageBasedBanner";
            })?.value;
            const finalBannerTemplates = getFinalBannerTemplates(clientConfigRef.current);
            setBannerTemplateOptions(finalBannerTemplates);
            const skuCodekey = skuParamConfig.value;
            const skuResponse = await fetchAllSKUcodes(skuCodekey,useSalesHubAPI);
            const allSkuCodes = skuResponse.data?.map((element: any  ) => { 
                return useSalesHubAPI ? element.name : element[skuResponse.skuCodekey];
            });
            bannerConfigRef.current = {
                additionalFiltersOptions,
                skuParamConfig,
                allSkuCodes,
                languageBasedBanner,
                schemeFilter
            };
             const couponFilterConfig = bannerConfig.find((item: { name: string; }) => item.name === "couponFilter");
            if(couponFilterConfig){
                setCouponFilter(couponFilterConfig.value)
            }
        }catch(err){
            console.log(err);
            setSchemesLoader(false);
            openPopup("Alert","Error while fetching banner config");
        }
    }
    function getAndSetLanguageConfig(){
        const languageConfig: configurationAttributeType<languageOptions[]>[] = getConfigFromClientConfig(clientConfigRef.current,"multi_lingual_configuration") ?? [defaultOptions.supportedLanguages];
        const configLanguageOptions = languageConfig.find((configObj) => configObj.name === "supportedLanguages")?.value ?? defaultOptions.supportedLanguages.value
        const languageOptions = [allLanguageOption, ...configLanguageOptions] as languageOptions[];

        availableLanguagesRef.current = languageOptions;
        const newLanguageBannerState: languageBannerState = {};
        for(const languageOption of languageOptions){
            const newBannerElements: bannerElementState[] = [];
            for(let elemNum=1;elemNum<=5;elemNum++){
                newBannerElements.push({});
            }
            const key:string = languageOption.code;
            newLanguageBannerState[key] = newBannerElements;
        }
        defaultLanguageBannerStateRef.current = {...newLanguageBannerState};
        setlanguageBannerState(cloneDeep(newLanguageBannerState));
    }
    function getAndSetBlocks(){
        let betaConfig = clientConfigRef.current.find((config: any) => {
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
        const roleLayoutConfig = getConfigFromClientConfig(clientConfigRef.current,`${savedRole?.id}_app_layout_configuration`);
        const allBlocks = useBeta ? betaBlocks : getConfigKeyValue(roleLayoutConfig,"homeScreenBlockWidget")
        if(!roleLayoutConfig || !allBlocks ){
            allBlocksRef.current = []
        }
        if(allBlocks && Array.isArray(allBlocks)){
            allBlocksRef.current = allBlocks;
            //
            setBlockSelectionState((prevState) => {
                return { 
                    ...prevState,
                    blockConfigEnabled: true
                }
            })
        } 
    }
    async function getAndPopulateData(){
        await getAllBrands();
        await getAndSetClientConfig();
        await getBannerBehaviourOption()
        await getAllCategories()
        await getAndSetBannerConfig();
        getAndSetGlobalFilters();
        getAndSetAllNeedBasedBuckets();
        getAndSetLanguageConfig();
        getAllBaskets();
        getAndSetBlocks();
        if(locationState?.blockData){
            //
            if(locationState?.blockData?.type == "PromoBlock"){
                locationState.blockData={...locationState?.blockData,bannerType:"1024 X 376"}
            }
            if(locationState?.blockData.bannerType.startsWith("template")){
                if(locationState?.blockData.bannerType==="template20"){
                    setSelectedBannerBehaviour( { label: "Auto Play Video", id: "tvAdds"})
                    setSelectedOption({ label: "Auto Play Video",resolution: { width: 0, height: 0 }})
                }else if(locationState?.blockData.bannerType==="template1234"){
                    setSelectedBannerBehaviour( { label: "Toggle Banner", id: "toggleBanner"})
                    setSelectedOption({ label: "Toggle Banner",resolution: { width: 1024, height: 270 }})
                }else if(locationState?.blockData.bannerType==="template29" || locationState?.blockData.bannerType==="template29"){
                    setSelectedBannerBehaviour( { label: "Bucket Linked Banners", id: "bucketBanner"})
                    const bannerResolution = resolutionMapping.find((bannerTemp) => bannerTemp.id === locationState?.blockData?.bannerType);
                    setSelectedOption({
                        label: bannerResolution!?.resolution,
                        resolution: {
                            width: parseInt(bannerResolution!?.resolution.split(" X ")[0]) || 0,
                            height: parseInt(bannerResolution!?.resolution.split(" X ")[1]) || 0
                        }
                    });
                }else{
                    setSelectedBannerBehaviour( { label: "Image", id: "banner"})
                    const bannerResolution = resolutionMapping.find((bannerTemp) => bannerTemp.id === locationState?.blockData?.bannerType);
                    setSelectedOption({
                        label: bannerResolution!?.resolution,
                        resolution: {
                            width: parseInt(bannerResolution!?.resolution.split(" X ")[0]) || 0,
                            height: parseInt(bannerResolution!?.resolution.split(" X ")[1]) || 0
                        }
                    });
                }
            }else{
                if(locationState?.blockData.bannerType!=="tvAdds" && locationState?.blockData.bannerType!=="toggleBanner"){
                    //
                    if(locationState?.blockData.bannerType==="300 X 420" || locationState?.blockData.bannerType==="1024 X 572"  || locationState?.blockData.bannerType==="210 X 240"){
                        setPageLoader(true)
                        const needBasedBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "Need Based Basket Banner");
                        const oneClickBasketBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "basketBannerOneClick");
                        const campaignBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "campaignBanner");
                        const allBuckets = [...needBasedBuckets, ...oneClickBasketBuckets, ...campaignBuckets]
                        if(!allBannersRef.current){
                            let allBanners = (await getAllBanners()) as Banner[];
                            allBannersRef.current = allBanners;
                        }
                        const allBanners = allBannersRef.current;
                        //
                        if (allBanners) {
                            const filteredBuckets = allBuckets.filter((bucket) => {
                                if (!bucket.bannerIds || bucket.bannerIds?.length === 0) {
                                  return true;
                                }
                                const matchingBanners = bucket.bannerIds?.map((bannerId: any) =>
                                  allBanners.find((b: any) => b.id === bannerId)
                                );
                                if (matchingBanners.every((banner:any) => !banner)) {
                                  return true;
                                }
                                const validBanners = matchingBanners.filter((banner:any) => banner !== null && banner !== undefined);
                            
                                if (validBanners?.length === 0) {
                                  return true; 
                                }
                                const allBannersHaveV2 = validBanners.every((banner:any) => 
                                  banner?.extendedAttributes?.bannerV2
                                );
                                return allBannersHaveV2;
                              });
                          
                            setAvailableBucketOptions(filteredBuckets);
                            setPageLoader(false)
                          }
                          setPageLoader(false)
                        setSelectedBannerBehaviour( { label: "Bucket Linked Banners", id: "bucketBanner"},)
                    }else{
                        setSelectedBannerBehaviour( { label: "Image", id: "banner"})
                    }
                    // if(locationState?.blockData.bannerType==="banner"){
                    //     setSelectedBannerBehaviour( { label: "Image", id: "banner"})
                    // }else if(locationState?.blockData.bannerType==="bucketBanner"){
                    //     setSelectedBannerBehaviour( { label: "Bucket Linked Banners", id: "bucketBanner"})
                    // }
                    setSelectedOption({
                        label: locationState?.blockData?.bannerType,
                        resolution: {
                            width: parseInt(locationState?.blockData?.bannerType.split(" X ")[0]) || 0,
                            height: parseInt(locationState?.blockData?.bannerType.split(" X ")[1]) || 0
                        }
                    });
                }else if(locationState?.blockData.bannerType==="tvAdds"){
                    setSelectedBannerBehaviour( { label: "Auto Play Video", id: "tvAdds"})
                    setSelectedOption({ label: "Auto Play Video",resolution: { width: 0, height: 0 }})
                }else{
                    setSelectedBannerBehaviour( { label: "Toggle Banner", id: "toggleBanner"})
                    setSelectedOption({ label: "Toggle Banner",resolution: { width: 1024, height: 270 }})
                }
            }
            // const bannerTemplate:BannerTemplate | undefined = (finalBannerTemplates?.find((template) => {
            //     return template.id === locationState?.blockData.bannerType;
            // })) ?? (bannerTemplates?.find((bannerTempObj) => {
            //     return bannerTempObj.id === locationState?.blockData.bannerType;
            // }))
            // setbannerTemplateType(bannerTemplate?bannerTemplate: defaultBannerTemplate);
            //
            const templateFilteredBlocks = getAvailableBlockOptionsOfTypeNew("Banner", allBlocksRef.current, locationState?.blockData.bannerType);
           
            setBlockSelectionState((prevState) => {
                return {
                    ...prevState,
                    blockOptions: templateFilteredBlocks,
                    selectedBlock: locationState?.blockData,
                    isChanged: true,
                    blockConfigEnabled: true
                }
            })
        }
        const locationBannerState: bannerData | undefined = locationState?.currentBanner;
        setIsMapped(locationBannerState?.extendedAttributes.mapped ?? false);
        const finalBannerTemplates = getFinalBannerTemplates(clientConfigRef.current);
        // if(props.parentType==="bucket" && props.parentView==="create"){
        //     setbannerTemplateType(finalBannerTemplates.find((template) => {
        //         return template.label === "Need based basket banner";
        //     }) || defaultBannerTemplate)
        // }
        if(locationBannerState && Object.keys(locationBannerState)?.length !== 0){
            //
            setIsEdit(true);
            const marketLevelTabsList = await getMarketTabsList();
            const outletLevelTabsList=  await getOutletTabsList();
            if(locationState?.currentBanner?.extendedAttributes?.distributionData){
                const { distributionData } = locationState?.currentBanner?.extendedAttributes;
                let schemeLocationBifurcations: any = {};
                marketLevelTabsList?.forEach((tab: string | number) => {
                    if (distributionData.hasOwnProperty(tab)) {
                        schemeLocationBifurcations[tab] = distributionData[tab].split('$*$');
                    }else{
                        schemeLocationBifurcations[tab]=[];
                    }
                });
                let schemeOutletBifurcations: any = {};
                outletLevelTabsList?.forEach((tab: string | number) => {
                    if (distributionData.hasOwnProperty(tab)) {
                        if (distributionData[tab].includes('$*$')) {
                            schemeOutletBifurcations[tab] = distributionData[tab].split('$*$');
                        } else {
                            schemeOutletBifurcations[tab] = distributionData[tab].split(',');
                        }
                    }else{
                        schemeOutletBifurcations[tab]=[]
                    }
                });
                if(distributionData?.loginId){
                    if (distributionData.loginId.includes('$*$')){
                        schemeOutletBifurcations.distributorDetails=distributionData?.loginId.split('$*$')
                    }else{
                        schemeOutletBifurcations.distributorDetails=distributionData?.loginId.split(',')
                    }
                }
                setValues({
                    schemeLocationBifurcations,
                    schemeOutletBifurcations
                });
            }
            const {bannerName , bannerDescription} = locationBannerState;
            setBannerDescription({bannerName,bannerDescription});
            setStartDate(dayjs(locationBannerState.extendedAttributes.distributionData.startDate));
            setEndDate(dayjs(locationBannerState.extendedAttributes.distributionData.endDate));
            const bannerTemplate:BannerTemplate | undefined = (finalBannerTemplates.find((template) => {
                return template.id === locationBannerState.bannerType;
            })) ?? (bannerTemplates.find((bannerTempObj) => {
                return bannerTempObj.id === locationBannerState.bannerType;
            }))
            //
            if(locationBannerState.bannerType.startsWith("template")){
                if(locationBannerState.bannerType==="template20"){
                    setSelectedBannerBehaviour( { label: "Auto Play Video", id: "tvAdds"})
                    setSelectedOption({ label: "Auto Play Video",resolution: { width: 0, height: 0 }})
                }else if(locationBannerState.bannerType==="template1234"){
                    setSelectedBannerBehaviour( { label: "Toggle Banner", id: "toggleBanner"})
                    setSelectedOption({ label: "Toggle Banner",resolution: { width: 1024, height: 270 }})
                }else if(locationBannerState.bannerType==="template29" || locationBannerState.bannerType==="template29"){
                    setSelectedBannerBehaviour( { label: "Bucket Linked Banners", id: "bucketBanner"})
                    const bannerResolution = resolutionMapping.find((bannerTemp) => bannerTemp.id === locationBannerState?.bannerType);
                    setSelectedOption({
                        label: bannerResolution!?.resolution,
                        resolution: {
                            width: parseInt(bannerResolution!?.resolution.split(" X ")[0]) || 0,
                            height: parseInt(bannerResolution!?.resolution.split(" X ")[1]) || 0
                        }
                    });
                }else{
                    setSelectedBannerBehaviour( { label: "Image", id: "banner"})
                    const bannerResolution = resolutionMapping.find((bannerTemp) => bannerTemp.id === locationBannerState?.bannerType);
                    setSelectedOption({
                        label: bannerResolution!?.resolution,
                        resolution: {
                            width: parseInt(bannerResolution!?.resolution.split(" X ")[0]) || 0,
                            height: parseInt(bannerResolution!?.resolution.split(" X ")[1]) || 0
                        }
                    });
                }
            }else{
                if(locationBannerState.bannerType!=="tvAdds" && locationBannerState.bannerType!=="toggleBanner"){
                    //
                    if(locationBannerState.bannerType==="banner"){
                        setSelectedBannerBehaviour( { label: "Image", id: "banner"})
                    }else if(locationBannerState.bannerType==="bucketBanner"){
                        setSelectedBannerBehaviour( { label: "Bucket Linked Banners", id: "bucketBanner"})
                    }
                    setSelectedOption(locationBannerState.extendedAttributes.resolution)
                }else if(locationBannerState.bannerType==="tvAdds"){
                    setSelectedBannerBehaviour( { label: "Auto Play Video", id: "tvAdds"})
                    setSelectedOption({ label: "Auto Play Video",resolution: { width: 0, height: 0 }})
                }else{
                    setSelectedBannerBehaviour( { label: "Toggle Banner", id: "toggleBanner"})
                    setSelectedOption({ label: "Toggle Banner",resolution: { width: 1024, height: 270 }})
                }
            }
            // setbannerTemplateType(bannerTemplate?bannerTemplate: defaultBannerTemplate);
            if(locationBannerState.bannerType==="bucketBanner"){
                setPageLoader(true)
                const needBasedBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "Need Based Basket Banner");
                const oneClickBasketBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "basketBannerOneClick");
                const campaignBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "campaignBanner");
                const allBuckets = [...needBasedBuckets, ...oneClickBasketBuckets, ...campaignBuckets]
                const allBanners = allBannersRef.current;
                //
                if (allBanners) {
                    const filteredBuckets = allBuckets.filter((bucket) => {
                        if (!bucket.bannerIds || bucket.bannerIds?.length === 0) {
                          return true;
                        }
                        const matchingBanners = bucket.bannerIds?.map((bannerId: any) =>
                          allBanners.find((b: any) => b.id === bannerId)
                        );
                        if (matchingBanners.every((banner:any) => !banner)) {
                          return true;
                        }
                        const validBanners = matchingBanners.filter((banner:any) => banner !== null && banner !== undefined);
                    
                        if (validBanners?.length === 0) {
                          return true; 
                        }
                        const allBannersHaveV2 = validBanners.every((banner:any) => 
                          banner?.extendedAttributes?.bannerV2
                        );
                        return allBannersHaveV2;
                      });
                  
                    setAvailableBucketOptions(filteredBuckets);
                  }
                  setPageLoader(false)
                const curBannerId = locationBannerState.id;
                const linkedBucket = allBuckets.find((bucket: any) => {
                    if(bucket.bannerIds){
                        return bucket.bannerIds.includes(curBannerId);
                    }
                    return false;
                })
                setSelectedBucket(linkedBucket || defaultSelectedBucket);
                prevLinkedBucketRef.current = linkedBucket || defaultSelectedBucket;
            }
            if(locationBannerState.extendedAttributes?.resolution?.label === "1024 X 400"){
                setIsBankingBanner(true);
                if(locationBannerState.extendedAttributes.bankName) setBankName(locationBannerState.extendedAttributes.bankName);
            }else if(bannerTemplate?.id === "template8" || bannerTemplate?.id === "template29"){
                const needBasedBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "Need Based Basket Banner");
                setAvailableBucketOptions(needBasedBuckets);
                const curBannerId = locationBannerState.id;
                const linkedNeedBasedBucket = needBasedBuckets.find((bucket: any) => {
                    if(bucket.bannerIds){
                        return bucket.bannerIds.includes(curBannerId);
                    }
                    return false;
                })
                setSelectedBucket(linkedNeedBasedBucket || defaultSelectedBucket);
                prevLinkedBucketRef.current = linkedNeedBasedBucket || defaultSelectedBucket;
            }else if(bannerTemplate?.id === "template32"){
                const oneClickBasketBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "basketBannerOneClick");
                setAvailableBucketOptions(oneClickBasketBuckets);
                const curBannerId = locationBannerState.id;
                const linkedOneClickBucket = oneClickBasketBuckets.find((bucket: any) => {
                    if(bucket.bannerIds){
                        return bucket.bannerIds.includes(curBannerId);
                    }
                    return false;
                })
                setSelectedBucket(linkedOneClickBucket || defaultSelectedBucket);
                prevLinkedBucketRef.current = linkedOneClickBucket || defaultSelectedBucket;
            }else if(bannerTemplate?.id === "template999"){
                const campaignBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "basketBannerOneClick");
                setAvailableBucketOptions(campaignBuckets);
                const curBannerId = locationBannerState.id;
                const linkedOneClickBucket = campaignBuckets.find((bucket: any) => {
                    if(bucket.bannerIds){
                        return bucket.bannerIds.includes(curBannerId);
                    }
                    return false;
                })
                setSelectedBucket(linkedOneClickBucket || defaultSelectedBucket);
                prevLinkedBucketRef.current = linkedOneClickBucket || defaultSelectedBucket;
            }
            const allBannerElements: bannerElementState[] = cloneDeep(locationBannerState.bannerElements);
            const curLanguageBannersState: languageBannerState = {...defaultLanguageBannerStateRef.current};
            for(const languageOption of availableLanguagesRef.current){
                let curLanguageBannerElements = []
                if(languageOption.code==="All"){
                     curLanguageBannerElements = allBannerElements.filter((bannerElement) => {
                        return bannerElement.extendedAttributes === null || !bannerElement.extendedAttributes?.languageCode;
                    })
                }else{
                    curLanguageBannerElements = allBannerElements.filter((bannerElement) => {
                        return bannerElement.extendedAttributes?.languageCode === languageOption.code;
                    })
                }
                curLanguageBannerElements.forEach((bannerElement) => {
                    setElementWRTmedia(bannerElement,curLanguageBannersState,bannerTemplate,languageOption.code);
                });
            }
            //
            setlanguageBannerState(curLanguageBannersState);
        } 
    }
    const getAndSetGlobalFilters = async ()=>{
        const filters = await getGlobalFilters("bannerGlobalFilter",clientConfigRef.current);
        if(filters?.length){
            setGenericFilter(filters);
        }
    }
    setPageLoader(true); //sets to true
    setSchemesLoader(true);
    getAndPopulateData();
    // setSchemesLoader(false);
    setPageLoader((prevState) => !prevState); //sets to false
  },[savedRole])  
  
//   useEffect(() => {
//     if (locationState?.currentBanner?.extendedAttributes?.mapped !== undefined) {
//       setIsMapped(locationState.currentBanner.extendedAttributes.mapped);
//     }
//   }, [locationState]);

  const handleBannerDescription = (event: ChangeEvent<HTMLInputElement>) => {
    const newElement:bannerDescriptionState = {};
    newElement[event.target.id as bannerDescriptionKeys] = event.target.value;
    setBannerDescription({...bannerDescription, ...newElement})
  }  
  const handleBlockChange = (event: SyntheticEvent,value: BlockObjType | null) => {
    //
    if(value) setBlockSelectionState({
        ...blockSelectionState,
        isChanged: true,
        selectedBlock: value
    })
  }
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
  const resetAll = () => {
    const newLanguageBannerState: languageBannerState = {};
    for(const languageOption of availableLanguagesRef.current){
        const newBannerElements: bannerElementState[] = [];
        for(let elemNum=1;elemNum<=5;elemNum++){
            newBannerElements.push({});
        }
        const key:string = languageOption.code;
        newLanguageBannerState[key] = newBannerElements;
    }
    setlanguageBannerState(newLanguageBannerState);
    defaultLanguageBannerStateRef.current = cloneDeep(newLanguageBannerState);
  }
  const handleBannerTemplateType = (value: any) => {
    setSelectedOption(value)
    // setbannerTemplateType(value)
    if(value?.label === "1024 X 400") setIsBankingBanner(true);
    else setIsBankingBanner(false);
    setBankName("");
    // if((value?.id && !bucketLinkedBannerTemplates.includes(value?.id)) && selectedBucket.id!==defaultSelectedBucket.id) setSelectedBucket(defaultSelectedBucket);
    // else if(value?.id === "template8" || value?.id === "template29"){
    //     if(bucketConfigRef.current){
    //         const needBasedBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "Need Based Basket Banner");
    //         setAvailableBucketOptions(needBasedBuckets);
    //     }
    // }else if(value?.id === "template32"){
    //     const oneClickBasketBuckets = bucketConfigRef.current?.[0]?.value.filter((option: any) => option.bucketDesign === "basketBannerOneClick");
    //     setAvailableBucketOptions(oneClickBasketBuckets);
    // }
    if(blockSelectionState.blockConfigEnabled && blockSelectionState.selectedBlock && !isEdit)
    //
    setBlockSelectionState((prevState) => {
        return { ...prevState, selectedBlock: defaultBlockObj}
    })
    resetAll();
  }

  const handleReset = () => {
    resetAll();
    setSelectedBannerBehaviour({ label: "", id: ""})
    setSelectedOption({
        label: "",
        imgSrc: null,
        resolution: { width: 0, height: 0 }
    })
    setCheckErrors(false);
    setIsBankingBanner(false);
    setBankName("");
    // setbannerTemplateType(defaultBannerTemplate);
    setBannerDescription({});
    setSelectedBucket(defaultSelectedBucket);
    //
    setBlockSelectionState((prevState) => {
        return { ...prevState, selectedBlock: defaultBlockObj, blockOptions: [], isChanged: false}
    })
    setResetFiltersFlag(!resetFiltersFlag);
    setDateValidation({
        startDate: "",
        endDate: ""
    })
    setStartDate(null);
    setEndDate(null); 
    setValues({schemeLocationBifurcations:{} ,schemeOutletBifurcations:{}})
  }
  const handleBankName = (event:SyntheticEvent,value:string) => {
    setBankName(value)
  }

  const validateBannerDescriptionFields = () => {
    let message = "";
    let invalidCount = 0;
    if(!selectedOption){
        message = "Please Select a Banner Resolution for uploading banner";
        invalidCount++;
    }
    if(!bannerDescription.bannerName || !bannerDescription.bannerDescription){
        message = "Please fill all the mandatory fields";
        invalidCount++;
    }
    if(invalidCount<2 && (dateValidation.startDate || !startDate?.isValid())){
        message = dateValidation.startDate ||  "Please select a valid Start Date";
        invalidCount++;
    }
    if(invalidCount<2 && (dateValidation.endDate || !endDate?.isValid())){
        message = dateValidation.endDate || "Please select a valid End Date";
        invalidCount++;
    }
    // if(!useBeta && invalidCount<2 && (blockSelectionState.blockConfigEnabled && !blockSelectionState.selectedBlock.id)){
    //     message = "Please select a block to link";
    //     invalidCount++;
    // }
    // if(invalidCount<2 && (isBankingBanner && !bankName)){
    //     message = "Please select Bank Name";
    //     invalidCount++;
    // }
    return {
        message,
        invalidCount
    }
  }
  const validateLanguageBannerElements = (langBannerElements: bannerElementState[],invalidCountStart: number,anyBannerElementSelectedTillNow: boolean) => {
    let message = "";
    let invalidCount = invalidCountStart;
    
    let isBannerTypeSelected = anyBannerElementSelectedTillNow;
    for(let bannerElemNumber = 0;bannerElemNumber<langBannerElements?.length;bannerElemNumber++){
        if(langBannerElements[bannerElemNumber] && Object.keys(langBannerElements[bannerElemNumber])?.length !== 0 && langBannerElements[bannerElemNumber].mediaName){
            isBannerTypeSelected = true;
            const bannerElement = langBannerElements[bannerElemNumber];
            //
            switch(bannerElement.mediaName){
                case "gif": //image and gif will have same validation
                case "image": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image";
                        invalidCount++;
                    }
                    if(invalidCount<2 && !bannerElement.additionalBlobKey && !bannerElement.inputRef?.files?.[0] && selectedBannerBehaviour?.id==="toggleBanner"){
                        message = "Please upload Image";
                        invalidCount++;
                    }//
                    if(invalidCount<2 && !bannerElement.additionalTogglePosition && !bannerElement.inputRef?.files?.[0] && selectedBannerBehaviour?.id==="toggleBanner"){
                        message = "Please add toggle position";
                        invalidCount++;
                    }
                    break;
                }
                case "redirectionToProduct": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please select redirection option";
                        invalidCount++;
                    }
                    break;
                }
                case "redirectionFromLinks": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please select redirection option";
                        invalidCount++;
                    }
                    break;
                }
                case "redirectionToAppPages": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please select redirection option";
                        invalidCount++;
                    }
                    break;
                }
                case "imageWithSchemes": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        if (bannerElement.schemeId===undefined) {
                            message = "Please select schemeID option";
                            invalidCount++;
                        }
                        if (bannerElement.schemeId && bannerElement.schemeId?.length <= 0) {
                            message = "Please select schemeID option";
                            invalidCount++;
                        }
                    }
                    break;
                }
                case "imageWithProducts": {
                    if(invalidCount<2){
                        // //
                        let isAtleastOneSelected = false;
                        for(let filter of bannerProductFilterMapping){
                            const key = filter.id;
                            if(bannerElement[key] && bannerElement[key]?.length){
                                isAtleastOneSelected = true;
                                break;
                            }
                        }
                        if(bannerElement.schemeId && bannerElement.schemeId?.length>0){
                            isAtleastOneSelected = true;
                        }
                        if(!isAtleastOneSelected){
                            message = "Please select atleast one product filter";
                            invalidCount++;
                        }
                    }
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image";
                        invalidCount++;
                    }
                    break;
                }
                case "youtubeLinkWithProducts": {
                    let isAtleastOneSelected = false;
                    for(let filter of bannerProductFilterMapping){
                        const key = filter.id;
                        if(bannerElement[key] && bannerElement[key]?.length){
                            isAtleastOneSelected = true;
                            break;
                        }
                    }
                    if(bannerElement.schemeId && bannerElement.schemeId?.length>0){
                        isAtleastOneSelected = true;
                    }
                    if(!isAtleastOneSelected){
                        message = "Please select atleast one product filter";
                        invalidCount++;
                    }
                    if(invalidCount<2 && !validateYoutubeUrl(bannerElement.mediaUrl || "")){
                        message = "Please enter a valid Youtube URL";
                        invalidCount++;
                    }
                    break;
                }
                case "youtube": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image for Youtube Banner Type";
                        invalidCount++;
                    }
                    if(invalidCount<2 && !validateYoutubeUrl(bannerElement.mediaUrl || "")){
                        message = "Please enter a valid Youtube URL";
                        invalidCount++;
                    }
                    break;
                }
                case "youtubeLink": {
                    if(invalidCount<2 && !validateYoutubeUrl(bannerElement.mediaUrl || "")){
                        message = "Please enter a valid Youtube URL";
                        invalidCount++;
                    }
                    break;
                }
                case "google": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image for Google Banner Type";
                        invalidCount++;
                    }
                    if(invalidCount<2 && !validateGoogleUrl(bannerElement.mediaUrl || "")){
                        message = "Please enter a valid URL";
                        invalidCount++;
                    }
                    break;
                }
                case "survey": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image for Google Banner Type";
                        invalidCount++;
                    }
                    if(invalidCount<2 && !validateGoogleUrl(bannerElement.mediaUrl || "")){
                        message = "Please enter a valid URL";
                        invalidCount++;
                    }
                    break;
                }
                case "communication": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image for Communication Banner Type";
                        invalidCount++;
                    }
                    if(invalidCount<2 && !bannerElement.additionalBlobKey && !bannerElement.additionalInputRef?.files?.[0]){
                        message = "Please upload Additonal File for Communication Banner Type";
                        invalidCount++;
                    }
                    if(invalidCount<2 && (!bannerElement.elementTitle || !bannerElement.elementDescription)){
                        message = "Please fill Element details for Communication Banner Type";
                        invalidCount++;
                    }
                    break;
                }
                case "CategoryImage": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image for Category Banner Type";
                        invalidCount++;
                    }
                    if(invalidCount<2 && !bannerElement.category){
                        message = "Please select a category";
                        invalidCount++;
                    }
                    break;
                }
                case "ImageWithBasketId": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image for ImageWithBasketId Type";
                        invalidCount++;
                    }
                    if(invalidCount<2 && !bannerElement.basket){
                        message = "Please select a Basket Id";
                        invalidCount++;
                    }
                    break;
                }
                case "Image with Products": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image";
                        invalidCount++;
                    }
                    break;
                }
                case "redirectToPage": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image";
                        invalidCount++;
                    }
                    //
                    if(invalidCount<2 && !bannerElement.redirection){
                        message = "Please select a page to redirect";
                        invalidCount++;
                    }
                    break;
                }
                case "contestBanner": {
                    if(invalidCount<2 && !bannerElement.blobKey && !bannerElement.inputRef?.files?.[0]){
                        message = "Please upload Image for Contest Banner Type";
                        invalidCount++;
                    }
                    if(invalidCount<2 && !validateGoogleUrl(bannerElement.mediaUrl || "")){
                        message = "Please enter a valid URL";
                        invalidCount++;
                    }
                    break;
                }
            }
            //checks for categorySubCategory
            // if(invalidCount<2 && (bannerTemplateType?.catSubCatReq || bannerElement.mediaName==="Image with Products" || bannerTemplateType?.id==="template9")){
            //     // //
            //     let isAtleastOneSelected = false;
            //     for(let filter of bannerProductFilterMapping){
            //         const key = filter.id;
            //         if(bannerElement[key] && bannerElement[key]?.length){
            //             isAtleastOneSelected = true;
            //             break;
            //         }
            //     }
            //     if(bannerElement.schemeId && bannerElement.schemeId.length>0){
            //         isAtleastOneSelected = true;
            //     }
            //     if(!isAtleastOneSelected){
            //         message = "Please select atleast one product filter";
            //         invalidCount++;
            //     }
            // }
            // if(invalidCount<2 && bannerTemplateType?.priorityFilter && !bannerElement.bannerPriority){
            //     message = "Please select priority for banner element";
            //     invalidCount++;
            // }
        }
        if(invalidCount>=2) break;
    }
    return {
        message,
        invalidCount,
        isBannerTypeSelected
    }
  }
  const validateBannerFields = () => {
    let message = "";
    if(props.validateAllParentInputs) message = props.validateAllParentInputs();
    if(message!==""){
        return message;
    }
    const bannerDescValidationResult = validateBannerDescriptionFields();

    message = bannerDescValidationResult.message;
    let invalidCount = bannerDescValidationResult.invalidCount;

    if(message!== "" && invalidCount>1){
        return "Multiple Fields are invalid, please fill all the required fields to continue";
    }
    let anyBannerElementSelectedTillNow = false;
    for(const languageCode in languageBannerState){
        const languageBannerElementsValidationResult = validateLanguageBannerElements(languageBannerState[languageCode],invalidCount,anyBannerElementSelectedTillNow);
        invalidCount = languageBannerElementsValidationResult.invalidCount;
        anyBannerElementSelectedTillNow = anyBannerElementSelectedTillNow || languageBannerElementsValidationResult.isBannerTypeSelected;
        message = languageBannerElementsValidationResult.message || message;
        if(message!=="" && invalidCount>1){
            return "Multiple Fields are invalid, please fill all the required fields to continue";
        }
    }
    if(anyBannerElementSelectedTillNow===false){
        message = "Please select a Banner Type of atleast one element";
        invalidCount++;
    } 
    return invalidCount<2? message : "Multiple Fields are invalid, please fill all the required fields to continue";
  }
  const handleSubmit = async () => {
    let couponFilterPayload:any={}
    if(couponFilter){
        const nonEmptyArrays: any = {};
        for (const key in values) {
            if (Object.prototype.hasOwnProperty.call(values, key)) {
                const obj = values[key];
                for (const prop in obj) {
                    if (Array.isArray(obj[prop]) && obj[prop]?.length > 0) {
                        const newKey = prop === "distributorDetails" ? "loginId" : prop;
                        // nonEmptyArrays[newKey] = obj[prop].join('$*$');
                        let separator = ',';
                        if (prop !== "distributorDetails" && prop !== "channel" && prop !== "outletCode" && prop !== "asm") {
                            separator = '$*$';
                        }
                        nonEmptyArrays[newKey] = obj[prop].join(separator);
                    }
                }
            }
        }
        couponFilterPayload=nonEmptyArrays;
        if(Object.keys(couponFilterPayload).length === 0){
            openPopup("Error","Please Select Market Filters");
            return;
        }
    }
    setShowLoader(true);    
    const bannerValidationMessage = validateBannerFields();
    //
    if(bannerValidationMessage!==""){
        setShowLoader(false);
        setOpenGenericModal(true);
        setCheckErrors(true);
        setPopupMessage(bannerValidationMessage);
        setPopupType("Alert")
        return;
    }
    const bannerElements = [];
    for(const languageCode in languageBannerState){
        const langBannerElements = languageBannerState[languageCode];
        for(let bannerElemNumber = 0;bannerElemNumber<5;bannerElemNumber++){
            const curLangBannerElement = cloneDeep(langBannerElements[bannerElemNumber]);
            if(curLangBannerElement && Object.keys(curLangBannerElement)?.length !== 0 && curLangBannerElement.mediaName){
                const elem = curLangBannerElement;
                let wordNum = numberInWords[bannerElemNumber];
                
                const { bannerPriority } = curLangBannerElement

                let extended_attributes_obj: bannerElementExtendedAttributes | null = null;
                if(languageCode!=="All") extended_attributes_obj = { languageCode };
                if(bannerPriority){
                    extended_attributes_obj = {...extended_attributes_obj, bannerPriority};
                    Reflect.deleteProperty(curLangBannerElement, 'bannerPriority');
                } 

                const commonDetails = {
                    elementType: "image",
                    elementNumber: bannerElemNumber+1,
                    mediaNameId: "mediaName" + wordNum.charAt(0).toLowerCase() + wordNum.slice(1),
                    bannerType: selectedBannerBehaviour?.id,
                    // bannerType: selectedOption?.resolution,
                    extendedAttributes: extended_attributes_obj
                }
                switch(elem.mediaName){
                    case "communication": {
                        const inputRef1 = curLangBannerElement.inputRef;
                        const inputRef2 = curLangBannerElement.additionalInputRef;
                        if(!curLangBannerElement.blobKey){
                            Reflect.deleteProperty(curLangBannerElement, 'inputRef');
                        }
                        if(!curLangBannerElement.additionalBlobKey){
                            Reflect.deleteProperty(curLangBannerElement, 'additionalInputRef');
                        }    
    
                        const blobKey1 = curLangBannerElement.blobKey;
                        const blobKey2 = curLangBannerElement.additionalBlobKey;
                        const elementComponents = [
                            {
                                bannerType: elem.mediaName,
                                fileName: elem.blobKey? elem.fileName : inputRef1?.files?.[0]?.name,
                                blobKey: blobKey1,
                                extendedAttributes: {
                                    fileName: elem.additionalBlobKey ? elem.additionalFileName: inputRef2?.files?.[0]?.name,
                                    fileType: elem.additionalBlobKey ? elem.additionalFileType: inputRef2?.files?.[0]?.type,
                                    blobKey: blobKey2,
                                    category: "",
                                    data: {
                                        imgList: [],
                                        descriptiveInfo: []
                                    }
                                }
                            }
                        ]
                        const elemDetails = {
                            ...curLangBannerElement,
                            ...commonDetails,
                            blobKey: blobKey1,
                            fileName: elem.blobKey? elem.fileName : inputRef1?.files?.[0]?.name,
                            elementComponents: JSON.stringify(elementComponents)
                        }
                        bannerElements.push(elemDetails);
                        break;
                    }
                    case "CategoryImage": {
                        const inputRef = curLangBannerElement.inputRef;
                        const category = curLangBannerElement.category;
                        if(!curLangBannerElement.blobKey){
                            Reflect.deleteProperty(curLangBannerElement,'inputRef');
                            Reflect.deleteProperty(curLangBannerElement,'category');
                        }
                        const blobKey = curLangBannerElement.blobKey;
                        const elementComponents = [
                            {
                                bannerType: elem.mediaName,
                                fileName: elem.blobKey? elem.fileName : inputRef?.files?.[0]?.name,
                                blobKey: blobKey,
                                extendedAttributes: {
                                    fileName: "",
                                    fileType: "",
                                    blobKey: "",
                                    category,
                                    data: {
                                        imgList: [],
                                        descriptiveInfo: []
                                    }
                                }
                            }
                        ]
                        const elemDetails = {
                            ...curLangBannerElement,
                            ...commonDetails,
                            elementTitle: "Element " + wordNum,
                            blobKey,
                            fileName: curLangBannerElement.blobKey? curLangBannerElement.fileName : inputRef?.files?.[0].name,
                            elementComponents: JSON.stringify(elementComponents)
                        }
                        bannerElements.push(elemDetails);
                        break;
                    }
                    case "ImageWithBasketId": {
                        let basketId = '';
                        const inputRef = curLangBannerElement.inputRef;
                        const category = curLangBannerElement.category;
                        if(!curLangBannerElement.blobKey){
                            Reflect.deleteProperty(curLangBannerElement,'inputRef');
                            Reflect.deleteProperty(curLangBannerElement,'category');
                        }
                        for(let i=0;i<basketObjects?.length;i++){
                            if(basketObjects[i].title === curLangBannerElement.basket){
                                basketId = basketObjects[i].id;
                                break;
                            }
                        }
                        const blobKey = curLangBannerElement.blobKey;
                        const elementComponents = [
                            {
                                bannerType: elem.mediaName,
                                fileName: elem.blobKey? elem.fileName : inputRef?.files?.[0]?.name,
                                blobKey: blobKey,
                                extendedAttributes: {
                                    fileName: "",
                                    fileType: "",
                                    blobKey: "",
                                    category,
                                    data: {
                                        imgList: [],
                                        descriptiveInfo: []
                                    },
                                    basketId: basketId,
                                    brand : curLangBannerElement.brand || ''
                                }
                            }
                        ]
                        const elemDetails = {
                            ...curLangBannerElement,
                            ...commonDetails,
                            elementTitle: "Element " + wordNum,
                            blobKey,
                            fileName: curLangBannerElement.blobKey? curLangBannerElement.fileName : inputRef?.files?.[0].name,
                            elementComponents: JSON.stringify(elementComponents)
                        }
                        bannerElements.push(elemDetails);
                        break;
                    }
                    case "youtubeLink": {
                        let elemDetails = {
                            ...commonDetails,
                            ...curLangBannerElement,
                            elementTitle: "Element " + wordNum
                        }
                        bannerElements.push(elemDetails);
                        break;
                    }
                    case "redirectToPage": {
                        const inputRef = curLangBannerElement.inputRef;
                        const elementComponents = {
                            redirection: curLangBannerElement.redirection,
                            ...(curLangBannerElement.redirection === "allProductsScreen" && {
                                tabType: "favourite",
                            })
                        }
                        Reflect.deleteProperty(curLangBannerElement, 'redirection');
                        if(!curLangBannerElement.blobKey){
                            Reflect.deleteProperty(curLangBannerElement, 'inputRef');
                        }
                        const elemDetails = {
                            ...curLangBannerElement,
                            ...commonDetails,
                            elementTitle: "Element " + wordNum,
                            blobKey: curLangBannerElement.blobKey,
                            fileName: curLangBannerElement.blobKey? curLangBannerElement.fileName : inputRef?.files?.[0].name,
                            elementComponents
                        }
                        bannerElements.push(elemDetails);
                        break;
                    }
                    default : {
                        //
                        const inputRef = curLangBannerElement.inputRef;
                        if(!curLangBannerElement.blobKey){
                            Reflect.deleteProperty(curLangBannerElement, 'inputRef');
                        }
                        let elemDetails = {};
                        if(curLangBannerElement.mediaName==="imageWithProducts" || curLangBannerElement.mediaName==="youtubeLinkWithProducts"){
                            const elementComponents: categoryElementComponents = {};
                            const mediaNameId = commonDetails.mediaNameId as mediaNameIdType;
                            bannerProductFilterMapping.forEach((filter: bannerProductFilterMappingObj) => {
                                const key = filter.id;
                                if(curLangBannerElement[key] && curLangBannerElement[key]?.length){
                                    elementComponents[`${filter.value}_${mediaNameId}`] = curLangBannerElement[key] as string[];
                                }
                                Reflect.deleteProperty(curLangBannerElement,filter.id);
                            })
                            Reflect.deleteProperty(commonDetails,'mediaNameId');
                            elemDetails = {elementComponents};
                        }
                            const elementComponents: categoryElementComponents = {};
                            if(curLangBannerElement["additionalBlobKey"]){
                            elementComponents["additionalBlobKey"] = curLangBannerElement.additionalBlobKey;
                            elemDetails = {elementComponents};
                            }
                            if(curLangBannerElement["additionalTogglePosition"]){
                            elementComponents["additionalTogglePosition"] = curLangBannerElement.additionalTogglePosition;
                            elemDetails = {elementComponents};
                            }
                            if(curLangBannerElement.schemeId){
                                curLangBannerElement.mediaName = "image"
                                elementComponents["schemeId"] = curLangBannerElement.schemeId
                                Reflect.deleteProperty(curLangBannerElement,"schemeId");
                                elemDetails = {elementComponents};
                            }
                            
    
                        elemDetails = {
                            ...elemDetails,
                            ...curLangBannerElement,
                            ...commonDetails,
                            elementTitle: "Element " + wordNum,
                            blobKey: curLangBannerElement.blobKey,
                            fileName: curLangBannerElement.blobKey? curLangBannerElement.fileName : inputRef?.files?.[0].name,
                        }
                        
                        bannerElements.push(elemDetails);
                    }
                }
                
            }
        }
    }
    
    const extraAttributes: {bankName?: string,bucketId?: string,blockId?: string,resolution?:any} = {};
    if(isBankingBanner){
        extraAttributes["bankName"] = bankName;
    }
    if(props.parentId && props.parentType){
        const attribute: "bucketId" | "blockId" = props.parentType+"Id" as "bucketId" | "blockId" ;
        extraAttributes[attribute] = props.parentId
    }
    if(selectedOption && selectedBannerBehaviour?.id!=="tvAdds"){
        extraAttributes["resolution"]=selectedOption
    }
    if(selectedOption && selectedBannerBehaviour?.id==="toggleBanner"){
        extraAttributes["resolution"]=selectedOption
    }
    const trimmedBannerName = {
        ...bannerDescription,
        bannerName: bannerDescription.bannerName?.trim(),
        bannerDescription: bannerDescription?.bannerDescription?.trim()
    }
    const bannerPayload = {
        ...trimmedBannerName,
        activeStatus: "active",
        bannerType: selectedBannerBehaviour?.id,
        // bannerType: bannerTemplateType?.id,
        ...extraAttributes,
        bannerElements,
        extendedAttributes: {
            ...extraAttributes,
            ...(mappedBanner ? { mapped: isMapped } : {}), 
            bannerV2:true,
            distributionData: {
                activeStatus: "active",
                banner: trimmedBannerName?.bannerName,
                startDate: startDate?.format("YYYY-MM-DD") + " 00:00:00",
                endDate: endDate?.format("YYYY-MM-DD") + " 23:59:59",
                // ...getCurrentGlobalFilterObject()
                ...(couponFilter ? couponFilterPayload : getCurrentGlobalFilterObject())
            }
        },
    }
    //
    const bannerDistributionPayload = await makeBannerDistributionData(cloneDeep(bannerPayload.extendedAttributes.distributionData),Boolean(couponFilter));
    const finalPayload: bannerV2DataPayload = {
        banner: bannerPayload,
        bannerDistribution: bannerDistributionPayload
    }
    //
    const bannerIdVal = locationState?.currentBanner?.id ?? "{{bannerId}}"; //on update use same id, on create backend will replace {{bannerId}} with actual generated Id
    //
    if(selectedBannerBehaviour?.id==="bucketBanner" && selectedBucket.id){
        if(!isEdit || selectedBucket.id !== prevLinkedBucketRef.current.id){
            const bucketMetaDataPayload = getBucketMetaData(bannerIdVal); 
            if(bucketMetaDataPayload){
                finalPayload.metaData = [bucketMetaDataPayload];
            }
        }
    }
    if(blockSelectionState.blockConfigEnabled && blockSelectionState.isChanged){
        const blockMetaDataPayload = getBlockMetaData(savedRole?.id,bannerIdVal,blockSelectionState.selectedBlock,clientConfigRef.current);
        //
        if(blockMetaDataPayload){
            if(finalPayload.metaData){
                finalPayload.metaData.push(blockMetaDataPayload);
            }else{
                finalPayload.metaData = [blockMetaDataPayload];
            }
        }
    }
    setShowLoader(false); 
    if(useSaleshub){
        // Transform and POST to Saleshub API
        try {
          const saleshubPayload = transformToSaleshubPayload(
            finalPayload,
            isEdit,
            isEdit ? locationState?.currentBanner?.id ?? null : undefined
          );
        //   const requestBody =
        //         saleshubPayload.length === 1
        //             ? saleshubPayload[0]
        //             : saleshubPayload;
        const requestBody = saleshubPayload;

          const response = await fetch('https://api.salescodeai.com/banners/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authorization': `${localStorage.getItem("auth_token") || defaultTokenNew}`,
            },
            body: JSON.stringify(requestBody),
          });
          if (response.ok) {
            setPopupType('Success');
            setPopupMessage('Banner submitted to Saleshub successfully');
            handleReset();
          } else {
            const err = await response.json().catch(() => ({}));
            setPopupType('Error');
            setPopupMessage('Saleshub API error: ' + (err.message || response.statusText));
          }
        } catch (e) {
          setPopupType('Error');
          setPopupMessage('Saleshub API error: ' + (e.message || e.toString()));
        }
        setOpenGenericModal(true);
        return;
    }
    validateWithOtp((verifiedUser?: manageUpdateAccessObj,response?: any)=>{
        if(couponFilter){
            doFinalSubmit(bannerPayload,verifiedUser,true,response);
        }else{
            doFinalSubmit(bannerPayload,verifiedUser,false,response);
        }
    },undefined,undefined,"/v2/banner",finalPayload,isEdit? "PUT": "POST");
  }
//   const updateBlockData = async (curBannerId: string,verifiedUser?: manageUpdateAccessObj) => {
//     try{
//         const role = "retailer";
//         const configName = `${role}_app_layout_configuration`;
//         const roleAppLayoutConfig = getClientConfigDomainType(clientConfigRef.current,configName);
//         const updatedRoleLayoutConfig = getUpdatedRoleAppLayoutConfig(roleAppLayoutConfig,blockSelectionState.selectedBlock,curBannerId);
//         const response = await updateRoleAppLayoutConfiguration(role,updatedRoleLayoutConfig,verifiedUser);
//         const response2 = await updateWholeSellerConfiguration(clientConfigRef.current,updatedRoleLayoutConfig,verifiedUser);
//         return true;
        
//     }
//     catch(err){
//         openPopup("Error","Something went wrong while linking banner with block");
//         return false;
//     }
//   }
 function getBucketMetaData(curBannerId: string,verifiedUser?: manageUpdateAccessObj){
    try{
        const bucketConfig = [...bucketConfigRef.current];
        const allBuckets = bucketConfig[0].value;
        if(isEdit && prevLinkedBucketRef.current.id !== selectedBucket.id){
            const previousBucketIdx = allBuckets.findIndex((bucket: any) => {
                return bucket.id === prevLinkedBucketRef.current.id;
            })
            if(previousBucketIdx !==  -1){
                const prevTgtBucket = allBuckets[previousBucketIdx];
                if(prevTgtBucket.bannerIds?.length){
                    prevTgtBucket.bannerIds = prevTgtBucket.bannerIds.filter((bannerId: string) => bannerId !== curBannerId);
                }
                allBuckets[previousBucketIdx] = prevTgtBucket;
                bucketConfig[0].value = allBuckets;
            }
        }
        const bucketIdx = allBuckets.findIndex(
            (bucket: any) => bucket.id === selectedBucket.id
        );
        const tgtBucket = allBuckets[bucketIdx];
        if(tgtBucket.bannerIds){
            if (!tgtBucket.bannerIds.includes(curBannerId)) {
            tgtBucket.bannerIds.push(curBannerId);
            }
            tgtBucket.bannerId = tgtBucket.bannerIds?.length>0? tgtBucket.bannerIds[0] : "";
        }else{
            tgtBucket.bannerIds = [curBannerId];
            tgtBucket.bannerId = curBannerId;
        }
        allBuckets[bucketIdx] = tgtBucket;
        bucketConfig[0].value = allBuckets;
        let bucketMetaDataBody = {
            domainName: "clientconfig",
            domainType: "bucket_configuration",
            domainValues: bucketConfig ,
            lob: getLob(),
        };
       return bucketMetaDataBody;
    }catch(err){
        openPopup("Error","Something went wrong while updating bucket config");
        return false;
    }
  }
//   const doBucketFinalSubmit=async (finalRequestBody:Object,verifiedUser?: manageUpdateAccessObj)=>{
//     const response = await updateBucketConfig(
//       finalRequestBody,
//       "bucket_configuration",
//       verifiedUser
//     );
//     if (response.status === 200 || response.status === 201) {
//         return;
//     } else {
//       throw new Error();
//     }
//   }
  const doFinalSubmit=async (payload:Object,verifiedUser?: manageUpdateAccessObj,couponFilterConfig?:boolean,verifyResponse?: any)=>{
    setShowLoader(true);
    const validationObj = validateBannerResponse(verifyResponse);
    if(validationObj?.success){
        setPopupType("Success");
        if(isEdit){
            setPopupMessage("Banner Updated Successfully");
        }else{
            setPopupMessage("Banner Created Successfully");
            handleReset();
        }
    }else{
        setPopupMessage(validationObj?.message);
        setPopupType("Error");
    }
    setOpenGenericModal(true);
    setShowLoader(false);
  }
  const selectedLanguageCode = availableLanguagesRef.current?.[selectedLanguageTab]?.code;
  const bannerElements = languageBannerState?.[selectedLanguageCode] ?? [];

  const [loading , setLoading] = useState<{market:boolean,outlet:boolean}>({
    market:false,
    outlet:false,
  });
  const [values , setValues] = useState<any>({schemeLocationBifurcations:{} ,schemeOutletBifurcations:{}});
  let locationTabs: Record<string, { tab: string; value: string }> = {};
  let outletTabs: Record<string, { tab: string; value: string }> = {};

  const handleChange = (name:string,newValue:Record<string,string>)=>{
    setValues((pre: any)=>({...pre,[name]:newValue}));
  }


  const getAllOptions = async (combinedSelectedValues:any, currentTabName:string,name:string,searchText?:string)=>{  
    setLoading((pre)=>({...pre , [name]:true }));
    try{
        const currTabPriority = getEntityPriority(currentTabName)
        const data: any = await getMarketDetailsOptions(combinedSelectedValues, currTabPriority, currentTabName, searchText,name);
        const newData: Record<string, string> = {};
        for (let tabName in data) {
            const colname = DB_COLUMN_NAME_MAP_COLUMN_NAME[tabName] ?? tabName
            newData[colname] = data[tabName];

        }
        return newData;
    }catch(err){
        console.error(err);
    }finally{
        setLoading((pre)=>({...pre,[name]:false}));
    }
}

const resetFilters = ()=>{
    let schemeLocationBifurcations: any = {};
    marketLevelTabsList.forEach((tab: string | number) => {
            schemeLocationBifurcations[tab]=[];
    });
    let schemeOutletBifurcations: any = {};
    outletLevelTabsList.forEach((tab: string | number) => {
            schemeOutletBifurcations[tab]=[]
    });
    setValues({
        schemeLocationBifurcations,
        schemeOutletBifurcations
    })
}
const arbitraryList=["outletCode","distributorDetails"]
console.log("selectedBannerBehaviour",selectedBannerBehaviour,"selectedOption",selectedOption)
  return (
    <>
    {schemesLoader ? <Loader /> :
        <BannerContext.Provider value={bannerConfigRef.current}>
      {pageLoader? <Loader /> : <Paper className="createBannerPaperContainer"> 

            {couponFilter ? <Box className="bannerDescriptionBoxContainer" sx={{ marginBottom: "18px" }}>
                            <div className='bannerDescriptionAndElementHeadingContainer'>
                                <Typography className='bannerElementAndDescriptionHeading' variant="h6" pl={2} >{translate(TranslationEnum.manage_banner,"Banner Distribution")}</Typography>
                                {!props.parentView ?   <BackButton /> : <></>}
                            </div>
                    <div className='filter-wrapper'>
                        <div className="market-detials-wrapper-content">
                        {/* <MarketDetailsSelector
                                    arbitraryList={arbitraryList}
                                    handleChange={handleChange}
                                    values={values}
                                    editMode={isEdit}
                                    loading={loading}
                                    getAllOptions={getAllOptions}
                                    chipLimit={1000}
                                    dataLimit={50000}
                                /> */}
                        </div>
                    </div>
                    <div className="filter-button-container">
                    <button className="filter-reset-button" onClick={resetFilters}> {translate(TranslationEnum.common_portal,"Reset")} </button>
                    </div>
                </Box> : <>
                    {genericFilter && genericFilter?.length !== 0 &&
                        <Box className="bannerDescriptionBoxContainer" sx={{ marginBottom: "18px" }}>
                            <div className='bannerDescriptionAndElementHeadingContainer'>
                                <Typography className='bannerElementAndDescriptionHeading' variant="h6" pl={2} >{translate(TranslationEnum.manage_banner,"Banner Distribution")}</Typography>
                                {!props.parentView ?<BackButton /> : <></>}
                            </div>
                            {/* <Box className="generic-filter-container">
                                <GenericFilters filterOptions={genericFilter} resetFiltersFlag={resetFiltersFlag} preSelectedData={locationState?.currentBanner?.extendedAttributes?.distributionData} />
                            </Box> */}
                        </Box>
                    }
                </>
            }
                
        <Box className="bannerDescriptionBoxContainer">
            <div className='bannerDescriptionAndElementHeadingContainer'>
                <Typography className='bannerElementAndDescriptionHeading' variant="h6" pl={2} >{translate(TranslationEnum.manage_banner,"Banner Description")}</Typography>
                {genericFilter && genericFilter?.length===0 && (!props.parentView?   <BackButton />:<></>)}
            </div>
            {isEdit && <TextField
              className='bannerNameTextField'
              label={translate(TranslationEnum.manage_banner,"Banner Id")}
              disabled
              name="bannerID"
              value={locationState?.currentBanner?.id ?? ""}
            />}
            <TextField className="bannerNameTextField createBannerInputsMargin" fullWidth disabled={isEdit} id="bannerName" label={translate(TranslationEnum.manage_banner,"Banner Name") + "*"} onChange={handleBannerDescription} error={checkErrors && !bannerDescription.bannerName} helperText={checkErrors && !bannerDescription.bannerName && "*please enter banner name"} value={bannerDescription.bannerName?bannerDescription.bannerName:""} variant="outlined" />
            <TextField className="createBannerInputsMargin" fullWidth id="bannerDescription" label={translate(TranslationEnum.manage_banner,"Banner Description") + "*"} onChange={handleBannerDescription} error={checkErrors && !bannerDescription.bannerDescription} helperText={checkErrors && !bannerDescription.bannerDescription && "*please enter banner description"} value={bannerDescription.bannerDescription?bannerDescription.bannerDescription:""} variant="outlined" />
            {/* <Autocomplete
                className="createBannerInputsMargin"
                disablePortal
                disableClearable
                disabled={isEdit || props.parentType==="bucket"}
                id="bannerTemplateTypes"
                options={bannerTemplateOptions}
                getOptionLabel={(option: BannerTemplate) => {
                    return option.displayName ?? option.label;
                 }}
                value={bannerTemplateType?.label?bannerTemplateType:defaultBannerTemplate}
                onChange={handleBannerTemplateType}
                renderInput={(params) => <TextField {...params} error={checkErrors && !bannerTemplateType?.label} helperText={checkErrors && !bannerTemplateType?.label && "*Please select a Banner Template"} label={translate(TranslationEnum.manage_banner,"Select Banner Template")} />}
            /> */}
              <Autocomplete
                className="createBannerInputsMargin"
                disablePortal
                disableClearable
                disabled={isEdit|| locationState?.blockData}
                options={bannerBehaviourOption}
                getOptionLabel={(option: any) => {
                    return  option.label;
                 }}
                value={selectedBannerBehaviour}
                onChange={handleBannerBehaviour}
                renderInput={(params) => <TextField {...params} error={checkErrors && !selectedBannerBehaviour} helperText={checkErrors && !selectedBannerBehaviour && "*Please select a Banner Template"} label={translate(TranslationEnum.manage_banner,"Select Banner Type") + "*"} />}
            />
               {/* {selectedBannerBehaviour && selectedBannerBehaviour?.id==="bucketBanner" && <Autocomplete
                className="createBannerInputsMargin"
                disablePortal
                disabled={locationState?.isBucketEdit}
                id="needBasedBucketDropdown"
                getOptionLabel={(option: any) => {
                   return !option.id? "" : (option.id + " - " + option.title)
                }}
                disableClearable
                options={availableBucketOptions}
                value={selectedBucket}
                onChange={(event,value) => {
                    setSelectedBucket(value);
                }}
                renderInput={(params) => <TextField {...params} error={checkErrors && !selectedBucket} helperText={checkErrors && !selectedBucket && "*Please select a Bucket"} label="Select Bucket" />}
            />} */}
        {selectedBannerBehaviour?.id && selectedBannerBehaviour.id !== "tvAdds" && selectedBannerBehaviour.id !== "toggleBanner" && (
            <Box sx={{ width: "100%", marginBottom: '20px' }}>
  <TextField
    error={checkErrors && !selectedOption?.label}
    helperText={checkErrors && !selectedOption?.label && "*Please select a Banner Resolution"}
    label="Select Banner Dimension*"
    variant="outlined"
    sx={{ width: "100%"}}
    value={selectedOption?.label || ""}
    disabled={isEdit || locationState?.blockData}
  />

  <Box sx={{ overflowX: 'scroll',height: '250px',display: 'flex' }}>
    {bannerOptions?.map((option) => (
        <Box
          className="test"
          key={option.label}
          onClick={() => {
            if (isEdit || locationState?.blockData) return;
            handleBannerTemplateType(option);
          }}
          sx={{
            display: 'inline-block', 
            padding: 1,
            cursor: (isEdit || locationState?.blockData) ? "not-allowed" : "pointer",
            border: selectedOption?.label === option.label ? "3px solid #ccc" : "",
            borderRadius: "8px",
            width: '250px', 
            flexShrink: 0,
            transition: "border 0.3s ease",
            "&:hover": {
              border: (isEdit || locationState?.blockData) ? "1px solid #ccc" : "3px solid lightblue",
            },
            pointerEvents: (isEdit || locationState?.blockData) ? "none" : "auto",
          }}
        >
          <Card
            sx={{
              width: '100%',
              height: '80%',
              boxShadow: "none",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CardMedia
              component="img"
              image={option.imgSrc!}
              title={option.label}
              sx={{
                objectFit: "contain",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            />
          </Card>
          <Typography variant="body2" align="center" sx={{ marginTop: "8px",backgroundColor:"#F2F2F2" ,fontWeight: "500" }}>
            {option.label} px
          </Typography>
        </Box>
      ))}
  </Box>
</Box>
)}
                  {/* && bannerTemplateType?.id!=="template34" */}
            {/* {blockSelectionState.blockConfigEnabled  && <Autocomplete
                className="createBannerInputsMargin"
                disablePortal
                disableClearable
                // disabled={isEdit}
                disabled={locationState?.blockData}
                id="bannerTemplateTypes"
                options={blockSelectionState.blockOptions}
                getOptionLabel={(option) => {
                    return option.id?  (option.id + " - " + option.name) : "" ;
                 }}
                value={blockSelectionState.selectedBlock}
                onChange={handleBlockChange}
                renderInput={(params) => <TextField {...params} error={checkErrors && !blockSelectionState.selectedBlock.id} helperText={checkErrors && !blockSelectionState.selectedBlock.id && "*Please select a Block to link"} label="Select Block to link" />}
            />} */}
            {isBankingBanner?<Autocomplete
                className="createBannerInputsMargin"
                disablePortal
                id="bannerTemplateTypes"
                options={["Axis","Finagg"]}
                value={bankName || ""}
                onChange={(event,value)=>{
                    handleBankName(event,value || "")}}
                renderInput={(params) => <TextField {...params} error={checkErrors && !bankName} helperText={checkErrors && !bankName && "*Please select a Bank Name"} label="Select Bank Name" />}
            />: <></>}
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
           {mappedBanner ?  <Box sx={{ mt: 2, mb: 2, p: 1, border: '1px solid #c3c4c3', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 2 }}>Mapped:</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isMapped}
                          onChange={(e) => setIsMapped(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#24c6b1',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#24c6b1',
                            },
                          }}
                        />
                      }
                      label={isMapped ? "Yes" : "No"}
                    />
                  </Box>: <></> }
        </Box>

        {bannerConfigRef.current.languageBasedBanner && <BannerLanguageSelection selectedTab={selectedLanguageTab} setSelectedTab={setSelectedLanguageTab} languageOptions={availableLanguagesRef.current} languageBannerState={languageBannerState} validateCurLanguageBannerElements={validateLanguageBannerElements} />}
        <BannerElementsNew useSaleshub={useSaleshub} bannerElements={bannerElements}
            key={selectedLanguageTab}
            languageCode={selectedLanguageCode}
            setLanguageBannerState={setlanguageBannerState}
            bannerResolutionType={selectedOption}
            bannerBehaviour={selectedBannerBehaviour}
            checkErrors={checkErrors}
            categories={categories}
            baskets={baskets}
            brands={brands}
            isEdit={isEdit}
        />
        <div className='createBannerButtonsContainer'>
            <Button
                className='createBannerActionButton'
                onClick={handleSubmit}
                variant="contained"
                disabled={showLoader}
                >
                {showLoader?<div className="bannerCircularProgressContainer"><CircularProgress size={15} color="inherit"/>{translate(TranslationEnum.common_portal,"SUBMIT")}</div> : <>{translate(TranslationEnum.common_portal,"SUBMIT")}</> }
                
            </Button>
            {!isEdit && !props.parentView?<Button
                className='createBannerActionButton'
                color='error'
                variant="outlined"
                onClick={handleReset}
                type="reset"
                disabled={showLoader}
                >
                {translate(TranslationEnum.common_portal,"RESET")}
            </Button>:<></>}
        </div>
        <GenericPopUp type={popupType} message={popupMessage} setOpenGenericModal={popupType==="Success"? () => {
            setOpenGenericModal(false);
            setBannerUpdateStatus(true); //setting update status to true so that can check for remove queryParams on manageBanner
            navigate(routes.banner, { replace: true });
        } :setOpenGenericModal} openGenericModal={openGenericModal} />
      </Paper>}
    </BannerContext.Provider> 
    }
    </>
  )
}


export default CreateNewBanner;