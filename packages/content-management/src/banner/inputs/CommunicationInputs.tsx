import React, { ChangeEvent, useRef, useState } from "react";
import { TextField } from '@mui/material';
import { communicationInputsProps } from '@/features/content-management/banner/create/bannerTypes';
import GenericFileUpload from "@/components/genericFileUpload/GenericFileUpload";
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";

const CommunicationInputs = (props: communicationInputsProps) => {
  const { translate } = usePortalTranslation();
  const CUR_COMPONENT="Manage Banner";
  function setBlobkey1(blobKey: any){
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, blobKey}
      return newLanguageBannerState;
    });
  }
  function setFileAttributes1(uploadedFileAtributes: any){
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, ...uploadedFileAtributes}
      return newLanguageBannerState
    });
  }
  function setBlobkey2(blobKey: any){
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, additionalBlobKey: blobKey}
      return newLanguageBannerState;
    });
  }
  function setFileAttributes2(uploadedFileAtributes: any){
    const { fileName , fileType } = uploadedFileAtributes;
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, additionalFileName: fileName, additionalFileType: fileType }
      return newLanguageBannerState
    });
  }
    const handleElementName = (event: ChangeEvent<HTMLInputElement>) => {
      props.setLanguageBannerState((prevLanguageBannerState) => {
        const newLanguageBannerState = {...prevLanguageBannerState};
        const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
        newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, elementTitle: event.target.value}
        return newLanguageBannerState
      });
    }

    const handleDescription = (event: ChangeEvent<HTMLInputElement>) => {
        props.setLanguageBannerState((prevLanguageBannerState) => {
          const newLanguageBannerState = {...prevLanguageBannerState};
          const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
          newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, elementDescription: event.target.value}
          return newLanguageBannerState
        });
    }

  return (
    <div className='bannerInputsContainer communicationInputsContainer'>
        <TextField className="createBannerInputsMargin" id="communicationElementName" onChange={handleElementName} value={props.elementState.elementTitle || ""} label={`${translate(TranslationEnum.manage_banner,"Element Name")}*`} variant="outlined" error={props.checkErrors && !props.elementState.elementTitle} helperText={props.checkErrors && !props.elementState.elementTitle && translate(TranslationEnum.manage_banner,"Please enter Element Title")}/>
        <TextField className="createBannerInputsMargin" id="communicationElementDescription" onChange={handleDescription} value={props.elementState.elementDescription || ""} label={`${translate(TranslationEnum.manage_banner,"Element Description")}*`} variant="outlined" error={props.checkErrors && !props.elementState.elementDescription} helperText={props.checkErrors &&  !props.elementState.elementDescription && translate(TranslationEnum.manage_banner,"Please enter Element Description")}/>
        <GenericFileUpload
        maxImageSize={props.maxImageSize}
        maxGifSize={props.maxGifSize}
          resolution={{
            height: parseInt(props.resolution.height),
            width: parseInt(props.resolution.width)
          }}  
          label={"Upload Image"}  
          defaultFile={props.elementState.blobKey} 
          setDefaultFile={setBlobkey1} 
          accept={{
              image: ["png","jpeg","jpg"],
          }}
          fileAttributes={{
            fileName: props.elementState.fileName,
            fileType: props.elementState.fileType
          }}
          setFileAttributes={setFileAttributes1}
          fetchBlobKey={true}
          errorMessage={(props.checkErrors && !props.elementState.blobKey)? "Please upload Image" : ""}
        />
        <GenericFileUpload
        maxImageSize={props.maxImageSize}
        maxGifSize={props.maxGifSize}
          resolution={{
            height: parseInt(props.resolution.height),
            width: parseInt(props.resolution.width)
          }}  
          label="Upload Additional Info File or Image of resolution"
          defaultFile={props.elementState.additionalBlobKey} 
          setDefaultFile={setBlobkey2} 
          accept={{
              image: ["png","jpeg","jpg"],
              application: ["pdf","vnd.ms-powerpoint","vnd.openxmlformats-officedocument.presentationml.presentation"]
          }}
          fileAttributes={{
            fileName: props.elementState.additionalFileName,
            fileType: props.elementState.additionalFileType
          }}
          setFileAttributes={setFileAttributes2}
          fetchBlobKey={true}
          errorMessage={(props.checkErrors && !props.elementState.blobKey)? translate(TranslationEnum.manage_banner,"Please upload Additional Info File") : ""}
        />
    </div>
  )
}

export default CommunicationInputs;