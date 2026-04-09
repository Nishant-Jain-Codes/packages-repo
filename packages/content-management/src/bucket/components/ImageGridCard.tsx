import {
  faEye,
  faEyeDropper,
  faEyeSlash,
  faImage,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, Typography } from "@mui/material";
import React, { ChangeEvent, MouseEventHandler, useEffect, useRef, useState } from "react";
import {
  ImageGridCardProps,
  primaryTypeState,
  secondaryTypesState,
} from "@/features/content-management/bucket/create/CreateBucketTypes";
// import { ChromePicker } from 'react-color';
import { ConfirmationPopUp } from "@/components/confirmationPopUp";
import { GenericPopUp } from "@/components/popup/genericPopUp";
import { fetchDocumentForDisplay } from "@/services/documentUploadService";
const MAX_LABEL_LENGTH = 10;
function ImageGridCard(props: ImageGridCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [confirmPopupState,setConfirmPopupState] = useState<boolean>(false);

  const [errorMessage,setErrorMessage] = useState<string>("");
  const [openGenericModal,setOpenGenericModal] = useState<boolean>(false);
  const [displayImage, setDisplayImage] = useState<string>("");

  const resolution = {
    width: 180,
    height: 120
  }

  useEffect(() => {
    if (props.blobKey && props.useSaleshub) {
      fetchDocumentForDisplay(props.blobKey).then(setDisplayImage);
    } else if (props.blobKey) {
      setDisplayImage(props.blobKey);
    } else {
      setDisplayImage("");
    }
  }, [props.blobKey, props.useSaleshub]);

  const updateGridCardState = (
    newInputRef: HTMLInputElement | null,
    newStatus: boolean
  ) => {
    if (props.isPrimaryType) {
      const newPrimaryTypes = props.selectedPrimaryTypesState.map(
        (primaryOption: primaryTypeState) => {
          if (primaryOption.id === props.primaryId)
            return {
              ...primaryOption,
              activeStatus: newStatus,
              inputRef: newInputRef,
            };
          else return { ...primaryOption };
        }
      );
      props.setSelectedPrimaryTypesState(newPrimaryTypes);
    } else {
      //if its secondary Type grid
      const primaryTypeIndex = props.selectedPrimaryTypesState.findIndex(
        (primaryType: primaryTypeState) => primaryType.id === props.primaryId
      );
      if (primaryTypeIndex !== -1) {
        const secondaryTypeIndex = props.selectedPrimaryTypesState[
          primaryTypeIndex
        ].secondaryTypeOptions!.findIndex(
          (secondaryOption: secondaryTypesState) => {
            return secondaryOption.id === props.id;
          }
        );
        if (
          secondaryTypeIndex !== -1 &&
          props.selectedPrimaryTypesState[primaryTypeIndex]
            .secondaryTypeOptions?.[secondaryTypeIndex]
        ) {
          const secondaryOptions = props.selectedPrimaryTypesState[
            primaryTypeIndex
          ].secondaryTypeOptions as secondaryTypesState[];
          let secondaryTypeOption: secondaryTypesState =
            secondaryOptions[secondaryTypeIndex];

          secondaryTypeOption = {
            ...secondaryTypeOption,
            inputRef: newInputRef,
            activeStatus: newStatus,
          };
          secondaryOptions[secondaryTypeIndex] = secondaryTypeOption;
          props.setSelectedPrimaryTypesState([
            ...props.selectedPrimaryTypesState,
          ]);
        }
      }
    }
  };
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      //reset state
      fileInputRef.current.click();
      updateGridCardState(null, props.activeStatus);
    }
  };
  const handleColorChange = (color: any) => {
    const primaryTypeIndex = props.selectedPrimaryTypesState.findIndex(
      (primaryType: primaryTypeState) => primaryType.id === props.primaryId
    );
    if (primaryTypeIndex !== -1) {
      const primaryItem =  props.selectedPrimaryTypesState[primaryTypeIndex] as primaryTypeState;
      primaryItem.color = color.hex;
      props.selectedPrimaryTypesState[primaryTypeIndex] = primaryItem;
      props.setSelectedPrimaryTypesState([...props.selectedPrimaryTypesState]);
    }
  }
  const removeItem = () => {
    const primaryTypeIndex = props.selectedPrimaryTypesState.findIndex(
      (primaryType: primaryTypeState) => primaryType.id === props.primaryId
    );
    if (primaryTypeIndex !== -1) {
      const primaryItem =  props.selectedPrimaryTypesState[primaryTypeIndex] as primaryTypeState;
      const newFilteredSecondaryTypes = primaryItem.secondaryTypeOptions?.filter((secondaryItem) => secondaryItem.id!==props.id);
      const newAvailableSecondaryTypes = primaryItem.availableSecondaryTypes? [props.value, ...primaryItem.availableSecondaryTypes] : [props.value];
      primaryItem.availableSecondaryTypes = newAvailableSecondaryTypes;
      primaryItem.secondaryTypeOptions = newFilteredSecondaryTypes;
      props.selectedPrimaryTypesState[primaryTypeIndex] = primaryItem;
      props.setSelectedPrimaryTypesState([...props.selectedPrimaryTypesState]);
    }
  }
  const handleCrossClick = () => {
    if(props.blobKey || props.inputRef?.files?.[0]){
      setConfirmPopupState(true);
    }
    else{
      removeItem();
    }
    
  }
  const handleEyeClick = () => {
    updateGridCardState(props.inputRef, !props.activeStatus);
  };
  const validateImageAndUpload = (file: File | undefined) =>{
    if(file) {
        let fileType = file.type.split('/')[0];
        let fileExtension = file.type.split("/")[1];
        if(fileType==="image"){
            if(["png"].includes(fileExtension)){
                // if(!file.name.trim().includes(" ")){
                    let img = new Image();
                    let objectUrl = URL.createObjectURL(file);
                    img.onload = function (evt) {
                        if(img.naturalHeight!==resolution.height || img.naturalWidth!==resolution.width){
                            setErrorMessage("The required image resolution is " + resolution.width + "X" + resolution.height + ". Your image has a resolution of " + img.naturalWidth +"X" + img.naturalHeight); 
                            setOpenGenericModal(true);
                        }else{
                            setErrorMessage("");
                            updateGridCardState(fileInputRef.current, true);
                        }
                    };
                    img.src = objectUrl;
                // }else{
                //   setErrorMessage("File Name should not contain spaces");
                //   setOpenGenericModal(true);
                // }
            }else{
                setErrorMessage("Image must be png")
                setOpenGenericModal(true);
            }
            
        }else{
            setErrorMessage("Please choose a image");
            setOpenGenericModal(true);
        }
        
    }
  }
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if(event.target?.files?.[0]) validateImageAndUpload(event.target.files[0])
  };
  const truncatedHeading =
    props.value.length > MAX_LABEL_LENGTH
      ? `${props.value.slice(0, MAX_LABEL_LENGTH)}...`
      : props.value;
  return (
    <div
      className={
        "create-bucket-grid-card" +
        (props.className ? ` ${props.className}` : "")
      }
    >
      <div className="create-bucket-grid-card-image">
        <div className="create-bucket-grid-eye-icon-container">
          {props.isPrimaryType? (props.activeStatus === true ? (
            <FontAwesomeIcon
              icon={faEye}
              className="create-bucket-grid-eye-icon"
              onClick={handleEyeClick}
            />
          ) : (
            <FontAwesomeIcon
              icon={faEyeSlash}
              className="create-bucket-grid-eye-icon"
              onClick={handleEyeClick}
            />
          )):
          <FontAwesomeIcon className="create-bucket-secondary-cross-icon" onClick={handleCrossClick} icon={faXmark} />
        }
        </div>
        <div className="create-bucket-grid-favicon-container">
          {props.inputRef ? (
            <>
              <img
                className="create-bucket-grid-image-preview"
                src={URL.createObjectURL(props.inputRef?.files?.[0]!)}
                onClick={handleImageClick}
                alt={"image for " + props.value}
              />
            </>
          ) : displayImage ? (
            <img
              className="create-bucket-grid-image-preview"
              src={displayImage}
              onClick={handleImageClick}
              alt={"image for " + props.value}
            />
          ) : (
            <>
              <FontAwesomeIcon
                icon={faImage}
                className="create-bucket-grid-favicon"
                onClick={handleImageClick}
              />
              <span className="create-bucket-grid-favicon-subtitle">
                Add Image {`(${resolution.width}X${resolution.height})`}
              </span>
            </>
          )}
          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
        </div>
      </div>
      <div className="create-bucket-grid-card-content">
        <Typography
          variant="h4"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title={isHovered ? props.value : ""}
          className={
            "create-bucket-grid-card-heading" +
            (!props.isPrimaryType
              ? " create-bucket-secondary-card-heading"
              : "")
          }
        >
          {truncatedHeading}
        </Typography>
      </div>
      <ConfirmationPopUp message={"Are you sure you want to delete this item?"}
        openConfirmModal={confirmPopupState}
        successMethod={
          () => {
            removeItem();
          }
        }
        setOpenConfirmModal={setConfirmPopupState}
        />
        <GenericPopUp
        type={"Alert"}
        message={errorMessage}
        setOpenGenericModal={setOpenGenericModal}
        openGenericModal={openGenericModal}
      />
    </div>
  );
}

export default ImageGridCard;
