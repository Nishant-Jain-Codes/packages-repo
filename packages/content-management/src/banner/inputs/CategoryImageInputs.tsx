import React, { ChangeEvent, SyntheticEvent, useRef, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { categoryInputsProps } from "@/features/content-management/banner/create/bannerTypes";
import GenericFileUpload from "@/components/genericFileUpload/GenericFileUpload";
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";

const CategoryImageInputs = (props:categoryInputsProps) => {
  const { translate } = usePortalTranslation();
  const CUR_COMPONENT="Manage Banner";
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
  const handleCategories = (event:SyntheticEvent,value:string | null) => {
    if(value) props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, category: value}
      return newLanguageBannerState
    });
  }
  return (  
    <>
      <Autocomplete
        className="createBannerInputsMargin"
        disableClearable
        disablePortal
        value={props.elementState.category as string || ""}
        id="elementType"
        options={props.categories}
        onChange={handleCategories}
        renderInput={(params) => <TextField error = {props.checkErrors && !props.elementState.category} helperText={props.checkErrors && !props.elementState.category && translate(TranslationEnum.manage_banner,"Please select a Category")} {...params} label={translate(TranslationEnum.manage_banner,"Select Category")} />}
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

export default CategoryImageInputs;