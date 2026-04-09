import React, { ChangeEvent, useRef, useState } from "react";
import { imageInputsProps } from "@/features/content-management/banner/create/bannerTypes";
import GenericFileUpload from "@/components/genericFileUpload/GenericFileUpload";
import { Autocomplete, TextField, Typography } from "@mui/material";

const ToggleImageInputs = (props: imageInputsProps) => {
  const togglePositionOptions = [
  { id: "topLeft", label: "Top-Left" },
  { id: "topRight", label: "Top-Right" },
  { id: "bottomLeft", label: "Bottom-Left" },
  { id: "bottomRight", label: "Bottom-Right" },
  { id: "center", label: "Center" }
];

  const selectedTogglePosition =
    togglePositionOptions.find(
      (i) => i.id === props.elementState.additionalTogglePosition
    ) || undefined;


  function setTogglePosition(value: any) {
    props.setLanguageBannerState((prev) => {
      const copy = { ...prev };
      const cur = copy[props.languageCode][props.elemNumber];
      copy[props.languageCode][props.elemNumber] = {
        ...cur,
        additionalTogglePosition: value?.id || ""
      };
      return copy;
    });
  }
  function setBlobkey(blobKey: any){
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, additionalBlobKey:blobKey}
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
      {/* <Typography
        className="bannerElementAndDescriptionHeading"
        pl={2}
      >
        Upload Toggle Image
      </Typography> */}
      <GenericFileUpload
      maxImageSize={props.maxImageSize}
      maxGifSize={props.maxGifSize}
        resolution={{
          height: parseInt(props.resolution?.height),
          width: parseInt(props.resolution?.width)
        }}  
        label={"Upload Toggle Image"}  
        defaultFile={props.elementState.additionalBlobKey} 
        setDefaultFile={setBlobkey} 
        accept={props.accept ?? {
            image: ["png","jpeg","jpg"],
        }}
        fileAttributes={{
          fileName: props.elementState.additionalFileName,
          fileType: props.elementState.additionalFileType
        }}
        setFileAttributes={setFileAttributes}
        fetchBlobKey={true}
        errorMessage={(props.checkErrors && !props.elementState.additionalBlobKey)? "Please upload Image" : ""}
      />
      <Autocomplete
        disableClearable
        disablePortal
        className="bannerTypeAutoSelect createBannerInputsMargin togglePositionSelect"
        value={selectedTogglePosition}
        id="togglePosition"
        options={togglePositionOptions}
        onChange={(_, val) => setTogglePosition(val)}
        renderInput={(params) => (
          <TextField {...params} label="Select Toggle Position" />
        )}
      />
    </div>
  );
}

export default ToggleImageInputs;
