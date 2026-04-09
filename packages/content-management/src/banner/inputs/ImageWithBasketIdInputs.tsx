import React, { ChangeEvent, SyntheticEvent, useRef, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { ImageWithBasketIdInputsProps } from "@/features/content-management/banner/create/bannerTypes";
import GenericFileUpload from "@/components/genericFileUpload/GenericFileUpload";

const ImageWithBasketIdInputs = (props:ImageWithBasketIdInputsProps) => {
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
    const handleBaskets = (event:SyntheticEvent,value:string | null) => {
      if(value) props.setLanguageBannerState((prevLanguageBannerState) => {
        const newLanguageBannerState = {...prevLanguageBannerState};
        const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
        newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, basket: value}
        return newLanguageBannerState
      });
    }
    return (  
      <>
      <Autocomplete
        className="createBannerInputsMargin"
        disablePortal
        value={props.elementState.basket || ""}
        id="elementType"
        options={props.baskets || []}
        onChange={handleBaskets}
        renderInput={(params) => <TextField error = {props.checkErrors && !props.elementState.basket} helperText={props.checkErrors && !props.elementState.basket && "Please select a Basket Id"} {...params} label="Select Basket Id" />}
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

export default ImageWithBasketIdInputs;