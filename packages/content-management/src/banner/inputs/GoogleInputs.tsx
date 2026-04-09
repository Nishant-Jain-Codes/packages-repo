import React, { ChangeEvent, useRef, useState } from "react";
import { TextField } from '@mui/material';
import { validateGoogleUrl } from '@/features/content-management/services/bannerServices';
import { googleInputsProps } from '@/features/content-management/banner/create/bannerTypes';
import GenericFileUpload from "@/components/genericFileUpload/GenericFileUpload";
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";

const GoogleInputs = (props: googleInputsProps) => {
  const { translate } = usePortalTranslation();
  const CUR_COMPONENT_COMMON="commonPortal";
  function setBlobkey(blobKey: any){
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, blobKey}
      return newLanguageBannerState;
    });
  }
  function setFileAttributes(uploadedFileAtributes: any){
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, ...uploadedFileAtributes}
      return newLanguageBannerState
    });
  }
  const handleURL = (event: ChangeEvent<HTMLInputElement>) => {
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, mediaUrl: event.target.value};
      return newLanguageBannerState;
    });
  }

  const isValid = validateGoogleUrl(props.elementState.mediaUrl || "");
  return (
    <div className='bannerInputsContainer youtubeInputsContainer'>
        <TextField className="createBannerInputsMargin" id="googleURL" value={props.elementState.mediaUrl?props.elementState.mediaUrl:""} error={props.checkErrors && !isValid} helperText={props.checkErrors && !isValid && translate(TranslationEnum.common_portal,"Please enter a valid URL")} label={`${translate(TranslationEnum.common_portal,"URL")}*`} onChange={handleURL} variant="outlined" />
        <GenericFileUpload
        maxImageSize={props.maxImageSize}
        maxGifSize={props.maxGifSize}
          useSaleshub={props.useSaleshub}
          resolution={{
            height: parseInt(props.resolution?.height),
            width: parseInt(props.resolution?.width)
          }}  
          label={"Upload Image"}  
          defaultFile={props.elementState.blobKey} 
          setDefaultFile={setBlobkey} 
          accept={{
              image: ["png","jpeg","jpg"],
          }}
          fileAttributes={{
            fileName: props.elementState.fileName,
            fileType: props.elementState.fileType
          }}
          setFileAttributes={setFileAttributes}
          fetchBlobKey={true}
          errorMessage={(props.checkErrors && !props.elementState.blobKey)? "Please upload Image" : ""}
        />
    </div>
  )
}

export default GoogleInputs;