import { Autocomplete, Box, Button, TextField, Typography } from '@mui/material'
import React, { SyntheticEvent, useEffect, useMemo, useState } from 'react'
import { bannerProductFilterMappingObj, bannerTemplateOptionConfigProps, bannerTypeOption } from '@/features/content-management/banner/create/bannerTypes';
import CategoryImageInputs from '@/features/content-management/banner/inputs/CategoryImageInputs';
import CategorySubcategory from '@/features/content-management/banner/inputs/CategorySubcategory';
import CommunicationInputs from '@/features/content-management/banner/inputs/CommunicationInputs';
import GoogleInputs from '@/features/content-management/banner/inputs/GoogleInputs';
import ImageInputs from '@/features/content-management/banner/inputs/ImageInputs';
import YoutubeInputs from '@/features/content-management/banner/inputs/YoutubeInputs';
import ImageWithBasketIdInputs from '@/features/content-management/banner/inputs/ImageWithBasketIdInputs';
import YoutubeLinkInputs from '@/features/content-management/banner/inputs/YoutubeLinkInputs';
import { bannerProductFilterMapping } from '@/features/content-management/banner/create/bannerTemplates';
import { TranslationEnum, usePortalTranslation } from '@/utils/TranslationProvider';
import { useTranslation } from 'react-i18next';
import RedirectToPage from '@/features/content-management/banner/inputs/RedirectToPage';
import { getPriorityLabel } from '@/utils/couponMarketDetailsUtils';
import AppSchemeFilter from '@/features/content-management/banner/inputs/AppSchemeFilter';
import { getNewConfiguration } from '@/utils/UtilityService';
import ToggleImageInputs from '@/features/content-management/banner/inputs/ToggleInput';

const defaultBannerOption = { id: "", label: "" } as bannerTypeOption;
function BannerTemplateOptionConfig(props: bannerTemplateOptionConfigProps) {
  const [autoSelectScheme, setAutoSelectScheme] = useState<boolean>(false);
  const [maxImageSize, setMaxImageSize] = useState<number | undefined>(undefined);
  const [maxGifSize, setMaxGifSize] = useState<number | undefined>(undefined);
  const [maxSelection, setMaxSelection] = useState<number | undefined>(undefined);
  useEffect(() => {
    async function fetchMaxImageSize() {
      try {
        const bannerConfig = await getNewConfiguration('banner_configuration');
        const bannerConfigValue= bannerConfig && bannerConfig?.domainValues?.[0].value;
        const bannerStatusConfig = bannerConfigValue && bannerConfigValue.find((item: { name: string; }) => item.name === "maxImageSize");
        const autoSelectScheme = bannerConfigValue && bannerConfigValue.find((item: { name: string; }) => item.name === "autoSelectScheme");
        const bannerGIF = bannerConfigValue && bannerConfigValue.find((item: { name: string; }) => item.name === "maxGifSize");
        const maxSelection = bannerConfigValue && bannerConfigValue.find((item: { name: string; }) => item.name === "maxSelection");
        setAutoSelectScheme(autoSelectScheme?.value);
        setMaxImageSize(bannerStatusConfig?.value);
        setMaxGifSize(bannerGIF?.value);
        setMaxSelection(maxSelection?.value)
      } catch (error) {
        console.error("Failed to fetch configuration", error);
      }
    }
    fetchMaxImageSize();
  }, []);
  const {translate} = usePortalTranslation();
  const priorityOptions = useMemo(() => Array.from({ length: 20 }, (_, i) => i + 1).map((number) => (
    number + ""
)),[])

  const [productFilterResetCounter,setProductFilterResetCounter] = useState<number>(0);
  const handlePriorityChange = (event: SyntheticEvent, value: string) => {
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, bannerPriority: value };
      return newLanguageBannerState;
    });
  }
  const handleBannerTemplateOptions = (event:SyntheticEvent, value: bannerTypeOption) => {
    if(value){
      if(props.bannerTemplateType?.catSubCatReq){
        let catSubCatStates = {};
        bannerProductFilterMapping.forEach((productFilter: bannerProductFilterMappingObj) => {
          if(props.elementState[productFilter.id]) catSubCatStates = {...catSubCatStates,[productFilter.id]: props.elementState[productFilter.id]}
        })
        props.setLanguageBannerState((prevLanguageBannerState) => {
          const newLanguageBannerState = {...prevLanguageBannerState};
          newLanguageBannerState[props.languageCode][props.elemNumber] = {...catSubCatStates,mediaName: value.id};
          return newLanguageBannerState;
        });
      }else{
        props.setLanguageBannerState((prevLanguageBannerState) => {
          const newLanguageBannerState = {...prevLanguageBannerState};
          newLanguageBannerState[props.languageCode][props.elemNumber] = {mediaName: value.id};
          return newLanguageBannerState;
        });
      }
    }
    
  }
  function loadBannerInputs(){
    switch(props.elementState?.mediaName){
        case "image": 
        if(props.bannerTemplateType?.id==="template9" || props.bannerTemplateType?.id==="template123"){
          return(
            <>
            <CategorySubcategory maxSelection={maxSelection} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} setLanguageBannerState = {props.setLanguageBannerState} categories={props.categories} checkErrors={props.checkErrors} productFilterResetCounter={productFilterResetCounter} />
            <ImageInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize}  key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors}/>
            </>
          )
        } else if (props.bannerTemplateType?.id === "template1234") {
          return (
            <>
              <ImageInputs accept={{ image: ["gif","png","jpeg","jpg"]}} maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
              <ToggleImageInputs accept={{ image: ["gif","png","jpeg","jpg"]}} maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.toggleResolution ?? props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
            </>
          )
        }
        else{
          return <ImageInputs  maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors}/>
        }
        case "youtube": return <YoutubeInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors}/>
        case "google": return <GoogleInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors}/>
        case "communication": return <CommunicationInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors}/>
        case "CategoryImage": return <CategoryImageInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} categories={props.categories}/>
        case "ImageWithBasketId": return <ImageWithBasketIdInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} baskets={props.baskets}/>
        case "Image with Products": return <ImageInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
        case "survey": return <GoogleInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors}/>
        case "youtubeLink": return <YoutubeLinkInputs key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
        case "redirectToPage": return <RedirectToPage maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} categories={props.categories}/>
        case "gif": return  <ImageInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} accept={{ image: ["gif"]}} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors} />
        case "contestBanner": return <GoogleInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors}/>
        case "imageWithSchemes": return(
          <>
          <AppSchemeFilter autoSelectScheme={autoSelectScheme} maxSelection={maxSelection} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} setLanguageBannerState = {props.setLanguageBannerState} categories={props.categories} checkErrors={props.checkErrors} productFilterResetCounter={productFilterResetCounter} />
          <ImageInputs maxImageSize={maxImageSize} maxGifSize={maxGifSize} key={props.elementState.mediaName} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} resolution={props.bannerTemplateType!.resolution} setLanguageBannerState={props.setLanguageBannerState} checkErrors={props.checkErrors}/>
          </>
        )
        default: return <></> 
    }
  }
  function handleReset(){
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      newLanguageBannerState[props.languageCode][props.elemNumber] = {};
      return newLanguageBannerState;
    });
    setProductFilterResetCounter(productFilterResetCounter+1);
  }
  const showResetButton = props.elementState.mediaName || (bannerProductFilterMapping.some((productFilter: bannerProductFilterMappingObj) => {
    return props.elementState[productFilter.id] && props.elementState[productFilter.id]?.length!==0;
  }))
  const selectedBannerType = useMemo(() => {
    return props.bannerTemplateType?.options.find((bannerOption: bannerTypeOption) => bannerOption.id === props.elementState.mediaName) ?? defaultBannerOption;
  },[props.elementState.mediaName])
  return (
    <Box className="bannerElementBoxContainer">
    <div className='bannerDescriptionAndElementHeadingContainer'><Typography className='bannerElementAndDescriptionHeading' variant="h6" pl={2} > {translate(TranslationEnum.manage_banner,"Element")} {props.elemNumber + 1}</Typography> </div>
    {(props.isEdit && props.elementState?.id) && <TextField className="bannerNameTextField" disabled={props.isEdit} id="bannerName" label={translate(TranslationEnum.manage_banner,"Banner Element ID")} value={props.elementState?.id} variant="outlined" />}
    <Autocomplete
        disableClearable
        disablePortal
        className="bannerTypeAutoSelect createBannerInputsMargin"
        value={selectedBannerType}
        id="elementType"
        options={props.bannerTemplateType?.options || []}
        onChange={handleBannerTemplateOptions}
        renderInput={(params) => <TextField {...params} label={translate(TranslationEnum.manage_banner,"Select Banner Type" )} />}
    />
    {props.bannerTemplateType?.priorityFilter && 
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
      <CategorySubcategory maxSelection={maxSelection} languageCode={props.languageCode} elemNumber={props.elemNumber} elementState={props.elementState} setLanguageBannerState = {props.setLanguageBannerState} categories={props.categories} checkErrors={props.checkErrors} productFilterResetCounter={productFilterResetCounter} />
    </> 
    : <></>}
    {loadBannerInputs()}
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

export default BannerTemplateOptionConfig   