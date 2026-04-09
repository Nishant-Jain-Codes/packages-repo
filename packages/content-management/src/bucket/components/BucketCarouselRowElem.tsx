import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleMinus,
  faGripLines,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  bucketCarouselRowProps,
  primaryTypeState,
} from "@/features/content-management/bucket/create/CreateBucketTypes";
import { GenericPopUp } from "@/components/popup/genericPopUp";
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";
import { fetchDocumentForDisplay } from "@/services/documentUploadService";

function BucketCarouselRowElem(props: bucketCarouselRowProps) {
  const CUR_COMPONENT = "Manage Bucket"
  const {translate}=usePortalTranslation();
  const resolution = {
    width: props.width ? props.width : 210,
    height: props.heigth ? props.heigth : 240,
  }
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage,setErrorMessage] = useState<string>("");
  const [openGenericModal,setOpenGenericModal] = useState<boolean>(false);
  const [displayImage, setDisplayImage] = useState<string>("");

  useEffect(() => {
    if (props.blobKey && props.useSaleshub) {
      fetchDocumentForDisplay(props.blobKey).then(setDisplayImage);
    } else if (props.blobKey) {
      setDisplayImage(props.blobKey);
    } else {
      setDisplayImage("");
    }
  }, [props.blobKey, props.useSaleshub]);
  function handleImageClick() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
    const updatedSelectedPrimarytypeState = props.selectedPrimaryTypesState.map(
      (option: primaryTypeState) => {
        if (option.id === props.id) {
          return { ...option, inputRef: null };
        }
        return option;
      }
    );
    props.setSelectedPrimaryTypesState(updatedSelectedPrimarytypeState);
  }
  const updatePrimaryState = () => {
    const updatedSelectedPrimarytypeState = props.selectedPrimaryTypesState.map(
      (option: primaryTypeState) => {
        if (option.id === props.id) {
          return { ...option, inputRef: fileInputRef.current, blobKey: "" };
        }
        return option;
      }
    );
    props.setSelectedPrimaryTypesState(updatedSelectedPrimarytypeState);
  }
  const validateImageAndUpload = (file: File | undefined) =>{
    if(file) {
        let fileType = file.type.split('/')[0];
        let fileExtension = file.type.split("/")[1];
        if(fileType==="image"){
          const allowedExtensions =
            props.bucketDesign === "1DGrid"
              ? ["png", "jpg", "jpeg","svg+xml"]
              : ["png"];
// debugger
            if (allowedExtensions.includes(fileExtension)){
                // if(!file.name.trim().includes(" ")){
                    let img = new Image();
                    let objectUrl = URL.createObjectURL(file);
                    img.onload = function (evt) {
                        if(img.naturalHeight!==resolution.height || img.naturalWidth!==resolution.width){
                            setErrorMessage("The required image resolution is " + resolution.width + "X" + resolution.height + ". Your image has a resolution of " + img.naturalWidth +"X" + img.naturalHeight);
                            setOpenGenericModal(true);
                        }else{
                            setErrorMessage("");
                            updatePrimaryState();
                        }
                    };
                    img.src = objectUrl;
                // }else{
                //   setErrorMessage("File Name should not contain spaces");
                //   setOpenGenericModal(true);
                // }
            }else{
              if( props.bucketDesign === "1DGrid"){
                setErrorMessage("Image must be png, jpg, jpeg or svg")
              }else{
                setErrorMessage("Image must be png")
              }
                setOpenGenericModal(true);
            }
            
        }else{
            setErrorMessage("Please choose a image");
            setOpenGenericModal(true);
        }
        
    }
  }

  function handleImageUpload() {
    validateImageAndUpload(fileInputRef.current?.files?.[0]);
  }
  function handleRemove() {
    const updatedSelectedPrimaryState = props.selectedPrimaryTypesState.filter(
      (option: primaryTypeState) => {
        return option.id !== props.id;
      }
    );
    props.setSelectedPrimaryTypesState(updatedSelectedPrimaryState);
    if (props.setPrimaryTypeOptions)
      props.setPrimaryTypeOptions([props.value, ...props.primaryTypeOptions]);
  }
  return (
    <div className="create-bucket-carousel-row">
      <div className="create-bucket-carousel-column create-bucket-carousel-drag-icon">
        <FontAwesomeIcon icon={faGripLines} fontSize="20px" />
      </div>
      <div className="create-bucket-carousel-column create-bucket-carousel-cells">
        <span>{translate(TranslationEnum.manage_bucket,"BUCKET ID")}</span>
        <span className="create-bucket-carousel-column-val">
          {props.elemNumber}
        </span>
      </div>
      <div className="create-bucket-carousel-column create-bucket-carousel-cells">
        {!props.inputRef ? (
            displayImage?
            <img
            className="bucket-carousel-row-elem-image"
            src={displayImage}
            height="30px"
            width="auto"
          onClick={handleImageClick}
            alt={"image for " + props.value}
          />:
          <>
            <span className="create-bucket-resolution-text bucket-carousel-row-elem-image" onClick={handleImageClick}>ADD IMAGE {`(${resolution.width}X${resolution.height})`}</span>
            <span className="create-bucket-carousel-column-val">
              <FontAwesomeIcon
                className="bucket-carousel-row-elem-image"
                icon={faImage}
                onClick={handleImageClick}
                fontSize="30px"
              />
            </span>
          </>
        ) : (
          <img
            className="bucket-carousel-row-elem-image"
            src={URL.createObjectURL(props.inputRef?.files?.[0]!)}
            height="30px"
            width="auto"
            onClick={handleImageClick}
            alt={"image for " + props.value}
          />
        )}
        <input
          ref={fileInputRef}
          onChange={handleImageUpload}
          type="file"
          hidden
        />
      </div>
      <div className="create-bucket-carousel-column">{props.value}</div>
      <div className="create-bucket-carousel-column create-bucket-carousel-column-minus-icon-container">
        <FontAwesomeIcon
          className="create-bucket-carousel-column-minus-icon"
          icon={faCircleMinus}
          onClick={handleRemove}
          fontSize="20px"
        />
      </div>
      <GenericPopUp
        type={"Alert"}
        message={errorMessage}
        setOpenGenericModal={setOpenGenericModal}
        openGenericModal={openGenericModal}
      />
    </div>
  );
}

export default BucketCarouselRowElem;
