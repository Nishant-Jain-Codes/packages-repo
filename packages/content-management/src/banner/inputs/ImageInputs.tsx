import React, { ChangeEvent, useRef, useState } from "react";
import { imageInputsProps } from "@/features/content-management/banner/create/bannerTypes";
import GenericFileUpload from "@/components/genericFileUpload/GenericFileUpload";

const ImageInputs = (props: imageInputsProps) => {
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
  return (
    <div className="bannerInputsContainer">
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
        accept={props.accept ?? {
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
  );
}

export default ImageInputs;
