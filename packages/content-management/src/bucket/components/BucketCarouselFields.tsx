import {
  faCirclePlus, faImage,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { bucketCarouselFieldsProps, primaryTypeState } from "@/features/content-management/bucket/create/CreateBucketTypes";
import GenricMultiSelect from "@/features/content-management/shared/GenericMultiSelect";
import BucketCarouselRowElem from "./BucketCarouselRowElem";
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";
const pluralMapping: Record<string, string> = {
  "Pack Size": "pack sizes",
  "Piece Size Description": "piece size descriptions",
  "Category": "categories",
  "Sub Category": "sub categories",
  "Brand": "brands",
  "Sub Brand": "sub brands",
  "Smart Buy": "smart buys"
};

function BucketCarouselFields(props: bucketCarouselFieldsProps) {
  const CUR_COMPONENT = "Manage Bucket"
  const {translate}=usePortalTranslation();
  const { primaryType, selectedPrimaryTypes } = props;
  function handleAddPrimaryTypes() {
    const newPrimaryTypesState = selectedPrimaryTypes.map((option: string) => {
      return {
        id: primaryType + "@" + option,
        value: option,
        inputRef: null,
        blobKey: "",
      };
    });
    props.setSelectedPrimaryTypesState([
      ...props.selectedPrimaryTypesState,
      ...newPrimaryTypesState,
    ]);
    const tempPrimaryTypeOptions = props.primaryTypeOptions.filter(
      (option: string) => {
        return !props.selectedPrimaryTypes.includes(option);
      }
    );
    if(props.setPrimaryTypeOptions) props.setPrimaryTypeOptions(tempPrimaryTypeOptions);
    if(props.setSelectedPrimaryTypes) props.setSelectedPrimaryTypes([]);
  }
  const handleSelectedPrimaryTypes = (selectedPrimaryTypeOptions: string[]) => {
    if(props.setSelectedPrimaryTypes) props.setSelectedPrimaryTypes(selectedPrimaryTypeOptions);
  }
  function handleDragOnEnd(result: DropResult) {
    if(result.destination!==null){
      const items = Array.from(props.selectedPrimaryTypesState);
      const [reorderedItem] = items.splice(result.source.index, 1);
      if (result.destination)
        items.splice(result.destination.index, 0, reorderedItem);

      props.setSelectedPrimaryTypesState(items);
    }
  }
  return primaryType ? (
    <>
      {props.view!=="partialEdit"?<><label className="create-basket-input-labels">
        {props.primaryType.toUpperCase()}
        <div style={{ fontSize: "12px", color: "#6b6b6b", marginLeft: "5px" }}>
          (Minimum 4 and maximum 15 {pluralMapping[props.primaryType] || props.primaryType.toLowerCase()} can be selected)
        </div>
      </label>
      <div className="create-bucket-primary-types-row">
        <GenricMultiSelect
          className="create-bucket-primary-type-multi-select"
          options={props.primaryTypeOptions}
          label={"Select " + props.primaryType}
          selectedOptions={props.selectedPrimaryTypes}
          handleMultiSelectState={handleSelectedPrimaryTypes}
          errorMessage={"Please select " + props.primaryType + "s"}
          isRequired={false}
          params={{ size: "small" }}
        />
        <FontAwesomeIcon
          onClick={handleAddPrimaryTypes}
          className="create-bucket-plus-icon"
          icon={faCirclePlus}
        />
        
      </div></>:<></>}
      <div className="create-bucket-carousel-item-and-preview-container">
        <DragDropContext onDragEnd={handleDragOnEnd}>
          <Droppable droppableId="droppableCarouselItems">
            {(provided) => (
              <div
                className="create-bucket-caraousel-items"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {props.selectedPrimaryTypesState.map(
                  (option: primaryTypeState, index: number) => {
                    return (
                      <Draggable
                        key={option.id}
                        draggableId={option.id}
                        index={index}
                      >
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}
                          {...provided.dragHandleProps}>
                            <BucketCarouselRowElem
                              useSaleshub={props.useSaleshub}
                              bucketDesign={props.bucketDesign}
                              width={props.width ? props.width : "210"}
                              heigth={props.heigth ? props.heigth : "240"}
                              id={option.id}
                              value={option.value}
                              elemNumber={index + 1}
                              inputRef={option.inputRef}
                              selectedPrimaryTypesState={
                                props.selectedPrimaryTypesState
                              }
                              view={props.view}
                              setSelectedPrimaryTypesState={
                                props.setSelectedPrimaryTypesState
                              }
                              primaryTypeOptions={props.primaryTypeOptions}
                              setPrimaryTypeOptions={props.setPrimaryTypeOptions}
                              blobKey={option.blobKey}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  }
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {props.selectedPrimaryTypesState.length>0 ? <div>
        <div className="create-bucket-grid-preview-container">
            <div className="create-bucket-grid-preview">
                  <div className="create-bucket-grid-preview-heading">
                      <h3 className="create-bucket-grid-preview-title">
                      {translate(TranslationEnum.manage_bucket,props.bucketTextFieldData.title)}
                      </h3>
                      <h5 className="create-bucket-grid-preview-subtitle">
                        {props.bucketTextFieldData.subtitle}
                      </h5>
                  </div>
                  <div className="create-bucket-grid-preview-tiles-container">
                    {
                      props.selectedPrimaryTypesState.map((option) => {
                        const file = option.inputRef?.files?.[0];
                        return  (<div key={option.id} className="create-bucket-grid-preview-image-container" >
                                  {file? <img className="create-bucket-grid-preview-image" src={URL.createObjectURL(file)} alt={option.value} />:(
                                    option.blobKey? <img className="create-bucket-grid-preview-image" src={option.blobKey} alt={option.value} />:
                                    <FontAwesomeIcon className="create-bucket-grid-preview-image" icon={faImage} />
                                  )}
                                </div>)
                      })
                    }
                  </div>
                  
            </div>
        </div></div>
        : <></>}
      </div>
    </>
  ) : (
    <></>
  );
}

export default BucketCarouselFields;
