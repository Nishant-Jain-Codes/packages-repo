import { Autocomplete, Box, Button, TextField, Typography } from '@mui/material'
import React, { SyntheticEvent, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { bannerProductFilterMappingObj, bannerTemplateOptionConfigProps, bannerTypeOption } from '@/features/content-management/banner/create/bannerTypes';
import { TranslationEnum, usePortalTranslation } from '@/utils/TranslationProvider';
import { useTranslation } from 'react-i18next';
import { bannerProductFilterMapping } from '@/features/content-management/banner/create/bannerTemplates';
import CategorySubcategory from '@/features/content-management/banner/inputs/CategorySubcategory';
import ImageInputs from '@/features/content-management/banner/inputs/ImageInputs';
import YoutubeInputs from '@/features/content-management/banner/inputs/YoutubeInputs';
import GoogleInputs from '@/features/content-management/banner/inputs/GoogleInputs';
import AppSchemeFilter from '@/features/content-management/banner/inputs/AppSchemeFilter';
import YoutubeLinkInputs from '@/features/content-management/banner/inputs/YoutubeLinkInputs';
import { getPriorityLabel } from '@/utils/couponMarketDetailsUtils';
import { BannerContext } from '@/features/content-management/banner/create/BannerContext';
import { getConfigFromClientConfig } from '@/features/content-management/services/bannerServices';
import { getMetaDataConfig, getNewConfiguration, getNewMarkteplaceConfiguration, getNewMetaDataConfig } from '@/utils/UtilityService';
import ToggleImageInputs from '@/features/content-management/banner/inputs/ToggleInput';

const defaultBannerOption = { id: "", label: "" } as bannerTypeOption;
function BannerTemplateOptionConfigNew(props: any) {
    const [maxImageSize, setMaxImageSize] = useState<number | undefined>(undefined);
    const [autoSelectScheme, setAutoSelectScheme] = useState<boolean>(false);
    const [maxGifSize, setMaxGifSize] = useState<number | undefined>(undefined);
    const [maxSelection, setMaxSelection] = useState<number | undefined>(undefined);
    useEffect(() => {
      async function fetchMaxImageSize() {
        try {
          const bannerConfig = await getNewMarkteplaceConfiguration('banner_configuration');
          const bannerConfigValue= bannerConfig && bannerConfig?.domainValues?.[0].value;
          const bannerStatusConfig = bannerConfigValue && bannerConfigValue.find((item: { name: string; }) => item.name === "maxImageSize");
          const bannerGIF = bannerConfigValue && bannerConfigValue.find((item: { name: string; }) => item.name === "maxGIFSize");
          const maxSelection = bannerConfigValue && bannerConfigValue.find((item: { name: string; }) => item.name === "maxSelection");
          const autoSelectScheme = bannerConfigValue && bannerConfigValue.find((item: { name: string; }) => item.name === "autoSelectScheme");
          setAutoSelectScheme(autoSelectScheme?.value);
          setMaxImageSize(bannerStatusConfig?.value);
          setMaxGifSize(bannerGIF?.value);
          setMaxSelection(maxSelection?.value)
        } catch (error) {
          console.error("Failed to fetch max image size", error);
        }
      }
      fetchMaxImageSize();
    }, []);
    const bannerConfig = useContext(BannerContext);
    const [showPriority,setShowPriority] = useState(false)
    const [allowedResolutions, setAllowedResolutions] = useState<string[]>(["1024 X 376", "500 X 416"]);
    const clientConfigRef = useRef<any[]>([]);
    const defaultRedirectionToProductList = [
        { label: "Scheme ID", id: "schemeId",mediaName:"imageWithSchemes" },
        { label: "Basket Type", id: "basket",mediaName:"ImageWithBasketId" },
        { label: "Customized Product List", id: "subCat",mediaName:"imageWithProducts" }
    ];
    const [redirectionToProductListOption, setRedirectionToProductListOption] = useState(defaultRedirectionToProductList);
    // 
    console.log("props?.bannerBehaviour?.id ",props?.bannerBehaviour?.id )
    const bannerElementOptions = props?.bannerBehaviour?.id 
    ? props?.bannerBehaviour?.id === "tvAdds" ? [
        { label: "Redirection To Product List", id: "redirectionToProductList",mediaName:"redirectionToProduct" }, 
        { label: "Redirection Via Links", id: "redirectionFromLinks",mediaName:"redirectionFromLinks" },
    ] : props?.bannerBehaviour?.id === "toggleBanner" ? [
        { label: "Image", id: "image",mediaName:"image" }, 
    ] :
    props?.bannerResolutionType?.label
      ? props?.bannerResolutionType?.label === "210 X 240"
        ? [
            { label: "Redirection To Product List", id: "redirectionToProductList", mediaName:"redirectionToProduct" }, 
          ]
        : [
            { label: "Image", id: "image" , mediaName:"image"}, 
            { label: "Redirection To Product List", id: "redirectionToProductList", mediaName:"redirectionToProduct" }, 
            { label: "Redirection Via Links", id: "redirectionFromLinks", mediaName:"redirectionFromLinks" },
            { label: "Redirection To App Pages", id: "redirectionToAppPages" , mediaName:"redirectToPage"}
          ]
      : [] 
  : [];

    const redirectionToProductList = props?.bannerBehaviour?.id === "tvAdds" ? [
        { label: "Customized Product List", id: "subCat",mediaName:"youtubeLinkWithProducts" }
    ] : props?.bannerResolutionType?.label === "210 X 240" ? [
        { label: "Customized Product List", id: "subCat",mediaName:"imageWithProducts" },
        { label: "Scheme ID", id: "schemeId",mediaName:"imageWithSchemes" },
    ]
    :redirectionToProductListOption;

    const redirectionFromLinksOption = props?.bannerBehaviour?.id === "tvAdds" ? [
        { label: "YouTube URL", id: "youtube",mediaName:"youtubeLink" }
    ] :[
        { label: "URL", id: "google",mediaName:"google" },
        { label: "YouTube URL", id: "youtube",mediaName:"youtube" }
    ];
    const mediaNameMapping = [
        {  element: "image",mediaName:"image" },
        { element: "redirectionToProductList",mediaName:"ImageWithBasketId" },
        { element: "redirectionToProductList",mediaName:"imageWithSchemes" },
        { element: "redirectionToProductList",mediaName:"imageWithProducts" },
        {  element: "redirectionFromLinks",mediaName:"google" },
        { element: "redirectionFromLinks",mediaName:"youtube" },
        { element: "redirectionFromLinks",mediaName:"youtubeLink" },
        { element: "redirectionToProductList",mediaName:"youtubeLinkWithProducts" },
        { element: "redirectionToAppPages",mediaName:"redirectToPage" }
    ];
    const defaultRedirectionToAppPagesOption = [
        { label: "All Catalogue", id: "allCatalogue" },
        { label: "Order Tracking", id: "orderTracking" },
        { label: "FAQ", id: "faqScreen" },
        { label: "Consumer Promo", id: "consumerPromo" },
        { label: "Language", id: "LanguageScreen" },
        { label: "Notification", id: "Notifications" },
        { label: "Offers", id: "offers" },
        { label: "Order Tracking", id: "orderTracking" },
        { label: "Privacy", id: "privacyLink" },
        { label: "Reward", id: "rewards" },
        { label: "Terms and Condition", id: "tncLink" },
        { label: "Support", id: "helpdesk" },
        { label: "One Click Page", id: "oneClick" },
        {
        id: "outletScreen-dbVisit",
        label: "Outlet Screen"
    }
    ]
    const [redirectionToAppPagesOption, setRedirectionToAppPagesOption] = useState(defaultRedirectionToAppPagesOption);

    const [selectedElementOption, setElementSelectedOption] = useState<any | null>(null);
    const [selectedSubOption, setSelectedSubOption] = useState<any | null>(null);
    const [selectedFinalOption, setSelectedFinalOption] = useState<any | null>(null);
    const [selectedBrandOption, setSelectedBrandOption] = useState<any | null>(null);
    console.log("props.elementState",props.elementState)

    const handleBannerTemplateOptions = (event: any, newValue: any) => {
        setElementSelectedOption(newValue);
        setSelectedSubOption(null);
        setSelectedFinalOption(null); 
        setSelectedBrandOption(null);
        props.setLanguageBannerState((prevLanguageBannerState:any) => {
            const newLanguageBannerState = {...prevLanguageBannerState};
            newLanguageBannerState[props.languageCode][props.elemNumber] = {mediaName: newValue.mediaName};
            return newLanguageBannerState;
          });
    };

    const handleSubOptionChange = (event: any, newValue: any) => {
        
        setSelectedSubOption(newValue);
        if(newValue && newValue?.mediaName) props.setLanguageBannerState((prevLanguageBannerState:any) => {
            const newLanguageBannerState = {...prevLanguageBannerState};
            const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
            newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, mediaName: newValue?.mediaName}
            return newLanguageBannerState
          });
        setSelectedFinalOption(null);
        setSelectedBrandOption(null);
    };
    const handlePagesOptionChange = (event: any, newValue: any) => {
        setSelectedSubOption(newValue);
        props.setLanguageBannerState((prevLanguageBannerState:any) => {
            
            const newLanguageBannerState = {...prevLanguageBannerState};
            const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
            const curElementComponentState = newLanguageBannerState[props.languageCode][props.elemNumber].elementComponents;
            newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, mediaName: "redirectToPage",redirection:newValue.id}
            return newLanguageBannerState
          });
        setSelectedFinalOption(null);
        setSelectedBrandOption(null);
    };

    const handleFinalOptionChange = (event: any, newValue: any) => {
        setSelectedFinalOption(newValue);
        if(newValue && selectedSubOption?.id==="basket") props.setLanguageBannerState((prevLanguageBannerState:any) => {
            const newLanguageBannerState = {...prevLanguageBannerState};
            const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
            newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, [selectedSubOption?.id]: newValue}
            return newLanguageBannerState
          });
    };

    const handlebrandOptionChange = (event: any, newValue: any) => {
        setSelectedBrandOption(newValue);
        if(newValue) props.setLanguageBannerState((prevLanguageBannerState:any) => {
            const newLanguageBannerState = {...prevLanguageBannerState};
            const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
            newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, brand: newValue}
            return newLanguageBannerState
          });
    };

  const {translate} = usePortalTranslation();

  const [productFilterResetCounter,setProductFilterResetCounter] = useState<number>(0);
//   const handleBannerTemplateOptions = (event:SyntheticEvent, value: bannerTypeOption) => {
//     if(value){
//       if(props.bannerTemplateType?.catSubCatReq){
//         let catSubCatStates = {};
//         bannerProductFilterMapping.forEach((productFilter: bannerProductFilterMappingObj) => {
//           if(props.elementState[productFilter.id]) catSubCatStates = {...catSubCatStates,[productFilter.id]: props.elementState[productFilter.id]}
//         })
//         props.setLanguageBannerState((prevLanguageBannerState:any) => {
//           const newLanguageBannerState = {...prevLanguageBannerState};
//           newLanguageBannerState[props.languageCode][props.elemNumber] = {...catSubCatStates,mediaName: value.id};
//           return newLanguageBannerState;
//         });
//       }else{
        // props.setLanguageBannerState((prevLanguageBannerState:any) => {
        //   const newLanguageBannerState = {...prevLanguageBannerState};
        //   newLanguageBannerState[props.languageCode][props.elemNumber] = {mediaName: value.id};
        //   return newLanguageBannerState;
        // });
//       }
//     }   
//   }
  function handleReset(){
    props.setLanguageBannerState((prevLanguageBannerState:any) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      newLanguageBannerState[props.languageCode][props.elemNumber] = {};
      return newLanguageBannerState;
    });
    setElementSelectedOption(null)
    setSelectedSubOption(null)
    setSelectedFinalOption(null)
    setSelectedBrandOption(null);
    setProductFilterResetCounter(productFilterResetCounter+1);
  }
  const showResetButton = props.elementState.mediaName || (bannerProductFilterMapping.some((productFilter: bannerProductFilterMappingObj) => {
    return props.elementState[productFilter.id] && props.elementState[productFilter.id]?.length!==0;
  }))
  const selectedBannerType = useMemo(() => {
      
      const matchingElement = mediaNameMapping?.find(mapping => mapping.mediaName === props.elementState.mediaName);
      let matchingBannerOption = null;
      if (matchingElement) {
          matchingBannerOption = bannerElementOptions?.find(option => option.id === matchingElement.element);
      }
      if(matchingBannerOption){
        setElementSelectedOption(matchingBannerOption)
    //   if(matchingBannerOption.id==="redirectionToProductList" || matchingBannerOption.id==="redirectionFromLinks" || matchingBannerOption.id==="redirectionToAppPages"){
    //   }
        if(matchingBannerOption.id==="redirectionToProductList"){
            let matchingBannerSubOption = redirectionToProductList?.find(option => option.mediaName === props.elementState.mediaName);
            setSelectedSubOption(matchingBannerSubOption)
            if(props.elementState.basket){
                setSelectedFinalOption(props.elementState.basket)
            }
            if(props.elementState.brand){
                setSelectedBrandOption(props.elementState.brand)
            }
        }
        if(matchingBannerOption.id==="redirectionFromLinks"){
            let matchingBannerSubOption = redirectionFromLinksOption?.find(option => option.mediaName === props.elementState.mediaName);
            setSelectedSubOption(matchingBannerSubOption)
        }
        if(matchingBannerOption.id==="redirectionToAppPages"){
            console.log("props.elementState",props.elementState)
            
            let matchingBannerSubOption = redirectionToAppPagesOption?.find(option => option.id === props.elementState.redirection);
            setSelectedSubOption(matchingBannerSubOption)
        }
      }
      return matchingBannerOption
  },[props.elementState.mediaName])
  console.log("props,selectedBannerType",selectedBannerType,selectedElementOption,selectedSubOption,selectedSubOption)
  useEffect(() => {
    async function getBannerBehaviourOption(){
        if(!clientConfigRef.current || clientConfigRef.current.length<=0){
            const clientConfig = await getNewMetaDataConfig();
            clientConfigRef.current = clientConfig;
        }
        const bannerConfig= getConfigFromClientConfig(clientConfigRef.current,"banner_configuration")?.[0]?.value;
        
        const productListOptions = bannerConfig?.find((option: {name: string}) => {
            return option.name === "productListOptions"
        })
        if(productListOptions && productListOptions.value && productListOptions.value.length>0 ){
            setRedirectionToProductListOption(productListOptions.value)
        }
    }
    getBannerBehaviourOption();
 }, [props?.bannerBehaviour?.id]);
 useEffect(() => {
    async function getPageTypeOption(){
        if(!clientConfigRef.current || clientConfigRef.current.length<=0){
            const clientConfig = await getNewMetaDataConfig();
            clientConfigRef.current = clientConfig;
        }
        const bannerConfig= getConfigFromClientConfig(clientConfigRef.current,"banner_configuration")?.[0]?.value;
        
        const pageTypeOptions = bannerConfig?.find((option: {name: string}) => {
            return option.name === "pageTypeOptions"
        })
        const showPriority = bannerConfig?.find((option: {name: string}) => {
            return option.name === "showPriority"
        })?.value;
        if(pageTypeOptions && pageTypeOptions.value && pageTypeOptions.value.length>0){
            setRedirectionToAppPagesOption(pageTypeOptions.value)
        }
        const showPriorityResolution = bannerConfig?.find((option: {name: string}) => {
            return option.name === "showPriorityResolution"
        })?.value;
        if(showPriorityResolution && showPriorityResolution.length>0){
            setAllowedResolutions(showPriorityResolution)
        }
        
        if(showPriority){
            setShowPriority(true)
        }
    }
    getPageTypeOption();
 }, []);
  useEffect(() => {
   if(!props.isEdit){
    setElementSelectedOption(null)
   }
}, [props?.bannerBehaviour?.id]);
const priorityOptions = useMemo(() => Array.from({ length: 20 }, (_, i) => i + 1).map((number) => (
    number + ""
)),[]);
const handlePriorityChange = (event: SyntheticEvent, value: string) => {
    props.setLanguageBannerState((prevLanguageBannerState:any) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, bannerPriority: value };
      return newLanguageBannerState;
    });
  }
  return (
    <Box className="bannerElementBoxContainer">
    <div className='bannerDescriptionAndElementHeadingContainer'><Typography className='bannerElementAndDescriptionHeading' variant="h6" pl={2} > {translate(TranslationEnum.manage_banner,"Element")} {props.elemNumber + 1}</Typography> </div>
          <Autocomplete
              disableClearable
              disablePortal
              className="bannerTypeAutoSelect createBannerInputsMargin"
              value={selectedElementOption?.label || ''}
              id="elementType"
              options={bannerElementOptions}
              onChange={handleBannerTemplateOptions}
              renderInput={(params) => (
                  <TextField {...params} label={translate(TranslationEnum.manage_banner, "Select Banner Behaviour")} />
              )}
          />
          {selectedElementOption?.id === 'image' && (
            <>
                <ImageInputs {...{
                    ...(props?.bannerBehaviour?.id === "toggleBanner"
                      ? { accept: { image: ["gif","png","jpeg","jpg"] } }
                      : {}),
                }} useSaleshub={props.useSaleshub} maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerResolutionType?.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
            </>
          )}
          {selectedElementOption?.id === 'image' && (
            <>
                {props?.bannerBehaviour?.id === "toggleBanner" && (
                    <ToggleImageInputs useSaleshub={props.useSaleshub} accept={{ image: ["gif","png","jpeg","jpg"]}} maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={{ height: "120", width: "180" }} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
                )}
            </>
          )}
          {selectedElementOption?.id === 'redirectionToProductList' && (
              <Box mt={2}>
                  <Autocomplete
                      className="bannerTypeAutoSelect createBannerInputsMargin"
                      disableClearable
                      disablePortal
                      value={selectedSubOption?.label || ''}
                      id="subOptionType"
                      options={redirectionToProductList}
                      onChange={handleSubOptionChange}
                      renderInput={(params) => (
                          <TextField {...params} label="Select Product List" />
                      )}
                  />
                  {selectedSubOption?.id === 'schemeId' && (
                      <>
                          <AppSchemeFilter autoSelectScheme={autoSelectScheme} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} setLanguageBannerState = {props.setLanguageBannerState} categories={props.categories} checkErrors={props.checkErrors} productFilterResetCounter={productFilterResetCounter} />
                          <ImageInputs useSaleshub={props.useSaleshub} maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerResolutionType?.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
                      </>
                  )}
                  {selectedSubOption?.id === 'basket' && (
                      <>
                          <Autocomplete
                          className="bannerTypeAutoSelect createBannerInputsMargin"
                              disableClearable
                              disablePortal
                              value={selectedFinalOption || ''}
                              id="basket"
                              options={props.baskets}
                              onChange={handleFinalOptionChange}
                              renderInput={(params) => (
                                  <TextField {...params} label="Select Basket Type" />
                              )}
                          />
                          <Autocomplete
                          className="bannerTypeAutoSelect createBannerInputsMargin"
                              disableClearable
                              disablePortal
                              value={selectedBrandOption || ''}
                              id="brand"
                              options={props.brands}
                              onChange={handlebrandOptionChange}
                              renderInput={(params) => (
                                  <TextField {...params} label="Select Brands for banner" />
                              )}
                          />
                          {/* <CategorySubcategory maxSelection={maxSelection} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} setLanguageBannerState = {props.setLanguageBannerState} categories={props.categories} checkErrors={props.checkErrors} productFilterResetCounter={productFilterResetCounter} /> */}
                          <ImageInputs useSaleshub={props.useSaleshub} maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerResolutionType?.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
                      </>
                  )}
                   {selectedSubOption?.id === 'subCat' && (
                      <>
                           <CategorySubcategory maxSelection={maxSelection} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} setLanguageBannerState = {props.setLanguageBannerState} categories={props.categories} checkErrors={props.checkErrors} productFilterResetCounter={productFilterResetCounter} />
                          { props?.bannerBehaviour?.id === "tvAdds" ?  <YoutubeLinkInputs key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />  : 
                           <ImageInputs useSaleshub={props.useSaleshub} maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerResolutionType?.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
                          }
                      </>
                  )}
              </Box>
          )}
            {selectedElementOption?.id === 'redirectionFromLinks' && (
              <Box mt={2}>
                  <Autocomplete
                      className="bannerTypeAutoSelect createBannerInputsMargin"
                      disableClearable
                      disablePortal
                      value={selectedSubOption?.label || ''}
                      id="subOptionType"
                      options={redirectionFromLinksOption}
                      onChange={handleSubOptionChange}
                      renderInput={(params) => (
                          <TextField {...params} label="Select Link Type" />
                      )}
                  />
                  {selectedSubOption?.id === 'google' && (
                      <>
                         <GoogleInputs useSaleshub={props.useSaleshub} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerResolutionType?.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors}/>
                      </>
                  )}
                  {selectedSubOption?.id === 'youtube' && (
                      <>
                      {props?.bannerBehaviour?.id === "tvAdds" ?  <YoutubeLinkInputs key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} /> : 
                          <YoutubeInputs useSaleshub={props.useSaleshub} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerResolutionType?.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors}/>
                      }                   
                      </>
                  )}
              </Box>
          )}
           {selectedElementOption?.id === 'redirectionToAppPages' && (
              <Box mt={2}>
                  <Autocomplete
                      className="bannerTypeAutoSelect createBannerInputsMargin"
                      disableClearable
                      disablePortal
                      value={selectedSubOption?.label || ''}
                      id="subOptionType"
                      options={redirectionToAppPagesOption}
                      onChange={handlePagesOptionChange}
                      renderInput={(params) => (
                          <TextField {...params} label="Select Page Type" />
                      )}
                  />
                   <ImageInputs useSaleshub={props.useSaleshub} maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerResolutionType?.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
              </Box>
          )}
          {(showPriority && allowedResolutions.includes(props.bannerResolutionType?.label ?? "")) &&  <Autocomplete 
        disableClearable
        disablePortal
        className="bannerTypeAutoSelect createBannerInputsMargin"
        value={props.elementState?.bannerPriority ?? ""}
        id="elementType"
        options={priorityOptions}
        getOptionLabel={((option) => option? option + " - " + getPriorityLabel(parseInt(option)) : "") }
        onChange={handlePriorityChange}
        renderInput={(params) => <TextField {...params}  label="Select Priority" />}
      />}
    {/* {props.bannerTemplateType?.priorityFilter && 
      <Autocomplete 
        disableClearable
        disablePortal
        className="bannerTypeAutoSelect createBannerInputsMargin"
        value={props.elementState?.bannerPriority ?? ""}
        id="elementType"
        options={priorityOptions}
        getOptionLabel={((option) => option? option + " - " + getPriorityLabel(parseInt(option)) : "") }
        onChange={handlePriorityChange}
        renderInput={(params) => <TextField {...params}  label="Select Priority" />}
      />
    }
    {props.bannerTemplateType?.catSubCatReq || props.elementState.mediaName === "Image with Products"?
    <>
      <CategorySubcategory languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} setLanguageBannerState = {props.setLanguageBannerState} categories={props.categories} checkErrors={props.checkErrors} productFilterResetCounter={productFilterResetCounter} />
    </> 
    : <></>} */}
    {/* {loadBannerInputs()} */}
    {showResetButton?<div className='bannerElementResetButtonContainer'>
      <Button
          className='bannerButtonStyles'
          onClick={handleReset}
          variant="contained"
        >
          {translate(TranslationEnum.common_portal,"RESET")}
        </Button>
      </div>: <></>}
</Box>
  )
}

export default BannerTemplateOptionConfigNew   