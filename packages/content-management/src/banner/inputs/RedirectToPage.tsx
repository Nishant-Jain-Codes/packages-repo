import React, { ChangeEvent, SyntheticEvent, useMemo, useRef, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { categoryInputsProps } from "@/features/content-management/banner/create/bannerTypes";
import GenericFileUpload from "@/components/genericFileUpload/GenericFileUpload";
import { optionObj } from "@/utils/UtilityService";
import { redirectionScreens } from "@/features/content-management/banner/create/bannerTemplates";

const RedirectToPage = (props:categoryInputsProps) => {
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
  const handleRedirectionChange = (event:SyntheticEvent,value:optionObj | null) => {
    if(value) props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, redirection: value.id}
      return newLanguageBannerState
    });
  }
  const selectedRedirectionOption = useMemo(() => {
    const defaultSelectedScreen = {
        id: "",
        label: ""
    }
    const selectedScreen = redirectionScreens.find((screenObj) => screenObj.id === props.elementState.redirection) ?? defaultSelectedScreen;
    return selectedScreen;
  },[props.elementState.redirection])
  return (  
    <>
      <Autocomplete
        className="createBannerInputsMargin"
        disableClearable
        disablePortal
        value={selectedRedirectionOption}
        id="redirectOption"
        options={redirectionScreens}
        onChange={handleRedirectionChange}
        renderInput={(params) => <TextField error = {props.checkErrors && !selectedRedirectionOption.id} helperText={props.checkErrors && !selectedRedirectionOption.id && "Please select the page you want to redirect"} {...params} label="Select page type" />}
        />    
      <div className="bannerInputsContainer"> 
      <GenericFileUpload
      maxImageSize={props.maxImageSize}
      maxGifSize={props.maxGifSize}
          resolution={{
            height: parseInt(props.resolution.height),
            width: parseInt(props.resolution.width)
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
    </>
  )
}

export default RedirectToPage;