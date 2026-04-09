import {
  faCirclePlus,
  faGripLines,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import {
  BucketGridFieldsProps,
  gridOptionsData,
  primaryTypeState,
  secondaryTypesState,
} from "@/features/content-management/bucket/create/CreateBucketTypes";
import GenricMultiSelect from "@/features/content-management/shared/GenericMultiSelect";
import { Loader } from "@/components/loader/Loader";
import { ConfirmationPopUp } from "@/components/confirmationPopUp";
import ImageGridCard from "./ImageGridCard";

function BucketGridFields(props: BucketGridFieldsProps) {
  const [confirmPopupState,setConfirmPopupState] = useState<boolean>(false);
  const [targetPrimaryOption,setTargetPrimaryOption] = useState<primaryTypeState>();
  async function handleAddPrimaryTypes() {
    const newPrimaryTypesState = props.selectedPrimaryTypes.map(
      (option: string, index: number) => {
        return {
          id: props.primaryType + "@" + option,
          value: option,
          inputRef: null,
          activeStatus: true,
          blobKey: "",
          secondaryTypeOptions: [],
          selectedSecondaryTypes: [],
          availableSecondaryTypes:
            props.gridDataMapping.find((gridOption: gridOptionsData) => {
              return gridOption.name === option;
            })?.secondaryOptions || [],
          color: "#ffffff",
        };
      }
    );
    props.setSelectedPrimaryTypesState([
      ...props.selectedPrimaryTypesState,
      ...newPrimaryTypesState,
    ]);
    const tempPrimaryTypeOptions = props.primaryTypeOptions.filter(
      (option: string) => {
        return !props.selectedPrimaryTypes.includes(option);
      }
    );
    if (props.setPrimaryTypeOptions)
      props.setPrimaryTypeOptions(tempPrimaryTypeOptions);
    if (props.setSelectedPrimaryTypes) props.setSelectedPrimaryTypes([]);
  }
  const handleSelectedPrimaryTypes = (selectedPrimaryTypeOptions: string[]) => {
    if (props.setSelectedPrimaryTypes)
      props.setSelectedPrimaryTypes(selectedPrimaryTypeOptions);
  };

  const handlePrimaryTypeDrag = (result: DropResult) => {
    if (result.destination) {
      if (result.type === "primaryItems") {
        const items = Array.from(props.selectedPrimaryTypesState);
        const [reorderedItem] = items.splice(result.source.index, 1);
        if (result.destination)
          items.splice(result.destination.index, 0, reorderedItem);
        props.setSelectedPrimaryTypesState(items);
      } else if (result.type === "secondaryItems") {
        const { source, destination } = result;
        if (source.droppableId === destination?.droppableId) {
          const primaryItems: primaryTypeState[] = Array.from(
            props.selectedPrimaryTypesState
          );
          const primaryIdx = primaryItems.findIndex(
            (primaryOption: primaryTypeState) =>
              primaryOption.id === source.droppableId
          );
          if (primaryIdx !== -1) {
            const secondaryItems = primaryItems[primaryIdx]
              .secondaryTypeOptions as secondaryTypesState[];
            const [reorderedItem] = secondaryItems.splice(source.index, 1);
            if (result.destination)
              secondaryItems.splice(result.destination.index, 0, reorderedItem);

            primaryItems[primaryIdx].secondaryTypeOptions = secondaryItems;
            props.setSelectedPrimaryTypesState(primaryItems);
          }
        }
      }
    }
  };
  return (props.gridDataMapping.length>0 && props.gridDataLoader===false)? (
    <>
      {props.view !== "partialEdit" ? (
        <>
          <label className="create-basket-input-labels">
            {props.primaryType.toUpperCase()}
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
          </div>
        </>
      ) : (
        <></>
      )}
      <DragDropContext onDragEnd={handlePrimaryTypeDrag}>
        <Droppable
          droppableId="droppablePrimaryGridItems"
          direction="vertical"
          type="primaryItems"
        >
          {(provided) => (
            <div
              className="create-bucket-grid-window"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {props.selectedPrimaryTypesState.map(
                (primaryOption: primaryTypeState, index: number) => {
                  return (
                    <Draggable
                      key={primaryOption.id}
                      draggableId={primaryOption.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          key={primaryOption.id}
                          className={"create-bucket-grid-primary-type-row" + (primaryOption.activeStatus===true? "" : " create-bucket-grid-primary-disabled")}
                        >
                          <div
                            className="create-bucket-primary-type-row-icon"
                            {...provided.dragHandleProps}
                          >
                            <FontAwesomeIcon icon={faGripLines} />
                          </div>
                          <ImageGridCard
                            useSaleshub={props.useSaleshub}
                            className="create-bucket-grid-first-card"
                            id={primaryOption.id}
                            inputRef={primaryOption.inputRef}
                            value={primaryOption.value}
                            selectedPrimaryTypesState={
                              props.selectedPrimaryTypesState
                            }
                            setSelectedPrimaryTypesState={
                              props.setSelectedPrimaryTypesState
                            }
                            isPrimaryType={true}
                            primaryId={primaryOption.id}
                            activeStatus={primaryOption.activeStatus || false}
                            blobKey={primaryOption.blobKey}
                            color={primaryOption.color}
                          />
                          <div className="create-bucket-secondary-type-options-container">
                            <div className="create-bucket-primary-types-row">
                              <GenricMultiSelect
                                className="create-bucket-primary-type-multi-select"
                                options={
                                  primaryOption.availableSecondaryTypes || []
                                }
                                label={"Select " + props.secondaryType}
                                selectedOptions={
                                  primaryOption.selectedSecondaryTypes || []
                                }
                                handleMultiSelectState={(
                                  selectedSecondaryTypeOptions: string[]
                                ) => {
                                  const newPrimaryItems =
                                    props.selectedPrimaryTypesState.map(
                                      (option: primaryTypeState) => {
                                        if (option.id === primaryOption.id)
                                          return {
                                            ...option,
                                            selectedSecondaryTypes: [
                                              ...selectedSecondaryTypeOptions,
                                            ],
                                          };
                                        else return { ...option };
                                      }
                                    );
                                  props.setSelectedPrimaryTypesState(
                                    newPrimaryItems
                                  );
                                }}
                                errorMessage={
                                  "Please select " + props.secondaryType + "s"
                                }
                                isRequired={false}
                                params={{ size: "small", disabled: !primaryOption.activeStatus }}
                              />
                              <FontAwesomeIcon
                                onClick={() => {
                                  const primaryIdx =
                                    props.selectedPrimaryTypesState.findIndex(
                                      (option) => primaryOption.id === option.id
                                    );
                                  if (primaryIdx !== -1) {
                                    const primaryItem = props
                                      .selectedPrimaryTypesState[
                                      primaryIdx
                                    ] as primaryTypeState;
                                    const availableSecondaryTypes =
                                      primaryItem.availableSecondaryTypes;
                                    const newAvailableSecondaryTypes =
                                      availableSecondaryTypes?.filter(
                                        (secondaryOption: string) => {
                                          return !primaryItem.selectedSecondaryTypes?.includes(
                                            secondaryOption
                                          );
                                        }
                                      );
                                    primaryItem.availableSecondaryTypes =
                                      newAvailableSecondaryTypes;
                                    const newSecondaryOptions =
                                      primaryItem.selectedSecondaryTypes
                                        ? primaryItem.selectedSecondaryTypes.map(
                                            (secondaryOptionVal) => {
                                              return {
                                                id:
                                                  primaryOption.value +
                                                  "@" +
                                                  secondaryOptionVal,
                                                blobKey: "",
                                                inputRef: null,
                                                value: secondaryOptionVal,
                                              };
                                            }
                                          )
                                        : [];
                                    primaryItem.secondaryTypeOptions =
                                      primaryItem.secondaryTypeOptions
                                        ? [
                                            ...primaryItem.secondaryTypeOptions,
                                            ...newSecondaryOptions,
                                          ]
                                        : [...newSecondaryOptions];
                                    primaryItem.selectedSecondaryTypes = [];
                                    props.selectedPrimaryTypesState[
                                      primaryIdx
                                    ] = primaryItem;
                                    props.setSelectedPrimaryTypesState([
                                      ...props.selectedPrimaryTypesState,
                                    ]);
                                  }
                                }}
                                className="create-bucket-plus-icon"
                                icon={faCirclePlus}
                              />
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="create-bucket-grid-trash-icon"
                                onClick={() => {
                                  setTargetPrimaryOption(primaryOption);
                                  setConfirmPopupState(true);
                                }}
                              />
                            </div>
                            <Droppable
                              droppableId={primaryOption.id}
                              direction="horizontal"
                              type="secondaryItems"
                            >
                              {(provided) => (
                                <div
                                  className="create-bucket-grid-secondary-cards-row"
                                  data-index={index}
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                >
                                  {primaryOption.secondaryTypeOptions ? (
                                    primaryOption.secondaryTypeOptions.map(
                                      (
                                        secondaryOption: secondaryTypesState,
                                        secondaryIndex
                                      ) => {
                                        return (
                                          <Draggable
                                            key={secondaryOption.id}
                                            draggableId={secondaryOption.id}
                                            index={secondaryIndex}
                                          >
                                            {(provided) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                              >
                                                {" "}
                                                <ImageGridCard
                                                  useSaleshub={props.useSaleshub}
                                                  id={secondaryOption.id}
                                                  inputRef={
                                                    secondaryOption.inputRef
                                                  }
                                                  value={secondaryOption.value}
                                                  selectedPrimaryTypesState={
                                                    props.selectedPrimaryTypesState
                                                  }
                                                  setSelectedPrimaryTypesState={
                                                    props.setSelectedPrimaryTypesState
                                                  }
                                                  isPrimaryType={false}
                                                  primaryId={primaryOption.id}
                                                  activeStatus={
                                                    secondaryOption.activeStatus ||
                                                    false
                                                  }
                                                  blobKey={
                                                    secondaryOption.blobKey
                                                  }
                                                />
                                              </div>
                                            )}
                                          </Draggable>
                                        );
                                      }
                                    )
                                  ) : (
                                    <></>
                                  )}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
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
      <ConfirmationPopUp message={"Are you sure you want to delete this whole item?"}
        openConfirmModal={confirmPopupState}
        successMethod={
          () => {
            if(targetPrimaryOption){
              const newFilteredPrimaryTypes =
              props.selectedPrimaryTypesState.filter(
                (option) => option.id !== targetPrimaryOption.id
              );
              props.setSelectedPrimaryTypesState(
                newFilteredPrimaryTypes
              );
              props.setPrimaryTypeOptions([
                targetPrimaryOption.value,
                ...props.primaryTypeOptions,
              ]);
            }
          }
        }
        setOpenConfirmModal={setConfirmPopupState}
      />
    </>
  ) : props.secondaryType ? (
    <Loader />
  ) : (
    <></>
  );
}

export default BucketGridFields;
