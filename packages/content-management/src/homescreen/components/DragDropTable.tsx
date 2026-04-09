import { faGripLines } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import Switch from 'react-switch';
import { DragDropTableProps } from '@/features/content-management/homescreen/manage/ManageHomePageTypes';
import { ManageHomePageConfig } from '@/features/content-management/homescreen/manage/ManageHomeScreenConfig';
import { TranslationEnum, usePortalTranslation } from '@/utils/TranslationProvider';

const DragDropTable = (props: DragDropTableProps & { showNormalTable?: boolean }) => {
  const { translate } = usePortalTranslation();
  const CUR_COMPONENT = "Manage Home Screen"
  const CUR_COMPONENT_COMMON="commonPortal";
  const navigate = useNavigate();
  function handleDragOnEnd(result: DropResult) {
    if(result.destination!==null){
      const items = Array.from(props.data);
      const [reorderedItem] = items.splice(result.source.index, 1);
      if (result.destination)
        items.splice(result.destination.index, 0, reorderedItem);

      props.setData(items);
    }
  }
  function renderTableCell(cell:any,row:any){
    if(row[cell.mappedValue]){
      return row[cell.mappedValue];
    }
    switch(cell.headerName){
      case "Update": { const isInnerComponentPresent = true ?? ["Basket","Banner","Bucket"].includes(row.type); //changing all to be updatable can change again to later;
                        return (<button
                              className={`manage-home-screen-table-button${!isInnerComponentPresent? " manage-home-screen-table-button-disabled-button" : ""}`}
                              disabled={!isInnerComponentPresent}
                              onClick={async () => {
                                props.setShowLoader(true);
                                navigate('/create-block',{
                                      state: {
                                        step: 'create-block',
                                        currentBlock: row,
                                        blocks: props.blockConfiguration[0].value,
                                        blockConfiguration: props.blockConfiguration
                                      }
                                });
                                // if(row.type==="Banner"){
                                //   // const allBanners = await getAllBanners();
                                //   // const targetBanner = allBanners.find((banner: bannerData) => banner.id === row.bannerId);
                                //   // const targetBanner: any = {};
                                //   // if(targetBanner){
                                //   //   targetBanner["bannerTemplateType"] = bannerTemplates.find((bannerTemplate) => targetBanner.bannerType === bannerTemplate.id)?.label;
                                //     navigate('createBlock',{
                                //       state: {
                                //         currentBlock: row,
                                //         blocks: props.blockConfiguration[0].value,
                                //         blockConfiguration: props.blockConfiguration
                                //       }
                                //     })
                                //   // }else{
                                //   //   props.setPopupAction("Error");
                                //   //   props.setGenericModalMessage("Unable to update block as banner linked to block has been deleted")
                                //   //   props.setOpenGenericModal(true);
                                //   // }
                                //   props.setShowLoader(false);
                                // }else if(row.type==="Bucket"){
                                //   const buckets = props.bucketConfiguration[0].value;
                                //   const currentBucket = buckets.find((bucket: any) => bucket.id === row.bucketId);
                                //   if(currentBucket){
                                //     if(currentBucket.bucketDesign==="Need Based Basket Banner"){
                                //       const allBanners = await getAllBanners();
                                //       const targetBanner = allBanners.find((banner: bannerData) => banner.id === currentBucket.bannerId);
                                //       if(targetBanner){
                                //         targetBanner["bannerTemplateType"] = "Need based basket banner";
                                //         navigate('createBlock',{
                                //           state: {
                                //             currentBlock: row,
                                //             currentBucket,
                                //             buckets,
                                //             bucketConfiguration: props.bucketConfiguration,
                                //             currentBanner: targetBanner,
                                //             blocks: props.blockConfiguration[0].value,
                                //             blockConfiguration: props.blockConfiguration
                                //           }
                                //         })
                                //       }else{
                                //         props.setPopupAction("Error");
                                //         props.setGenericModalMessage("Unable to update block of bucket type as banner linked to bucket has been deleted")
                                //         props.setOpenGenericModal(true);
                                //       }
                                //       props.setShowLoader(false);
                                //     }else{ //if bucket exist and not a need based basket type bucket
                                //       props.setShowLoader(false);
                                //       navigate('createBlock',{
                                //         state: {
                                //           currentBlock: row,
                                //           currentBucket,
                                //           buckets,
                                //           bucketConfiguration: props.bucketConfiguration,
                                //           blocks: props.blockConfiguration[0].value,
                                //           blockConfiguration: props.blockConfiguration
                                //         }
                                //       })
                                //     }
                                //   }else{
                                //     props.setPopupAction("Error");
                                //     props.setGenericModalMessage("Unable to update this block of bucket type as bucket linked to block has been deleted")
                                //     props.setOpenGenericModal(true);
                                //     props.setShowLoader(false);
                                //   }
                                  
                                // }else if(row.type==="Basket"){
                                //   props.setShowLoader(false);
                                //   const baskets = props.basketConfiguration[0].value;
                                //   const currentBasket = baskets.find((basket: any) => basket.id === row.basketId);
                                //   if(currentBasket){
                                //     navigate('createBlock',{
                                //       state: {
                                //         currentBlock: row,
                                //         row: currentBasket,
                                //         domainValues: props.basketConfiguration,
                                //         blocks: props.data,
                                //         blockConfiguration: props.blockConfiguration
                                //       }
                                //     })
                                //   }else{
                                //     props.setPopupAction("Error");
                                //     props.setGenericModalMessage("Unable to update this block of basket type as basket linked to block has been deleted")
                                //     props.setOpenGenericModal(true);
                                //     props.setShowLoader(false);
                                //   }
                                  
                                // }else{
                                //   navigate('createBlock',{
                                //     state: {
                                //       currentBlock: row,
                                //       blocks: props.blockConfiguration[0].value,
                                //       blockConfiguration: props.blockConfiguration
                                //     }
                                //   })
                                //   props.setShowLoader(false);
                                // }
                                props.setShowLoader(false);
                              }}
                            >
                              {translate(TranslationEnum.manage_home_screen,"UPDATE")}
                            </button>)}
      case "Delete": return (<button
                                className="manage-home-screen-table-button manage-home-screen-delete-button"
                                onClick={() => {
                                  props.setConfirmPopupMessage( translate(TranslationEnum.manage_home_screen,`Do you want to delete block with id: {blockID}`,{"blockID":row.id}));
                                  props.setBlockAction("delete");
                                  props.setCurrentBlockData(row);
                                  props.setOpenConfirmPopup(true);
                                }}
                              >
                                {translate(TranslationEnum.manage_home_screen,"DELETE")}
                              </button>)
      case "Active Status": return <Switch
                                    className='manage-home-screen-status-toggle'
                                    onChange={() => {
                                      props.setConfirmPopupMessage( translate(TranslationEnum.manage_home_screen,`Do you want to ${row.statusEnabled? "deactivate" : "activate"} block with ID: {blockID}`,{"blockID":row.id}));
                                      props.setBlockAction("activeStatusChange");
                                      props.setCurrentBlockData(row);
                                      props.setOpenConfirmPopup(true);
                                    }}
                                    checked={row.statusEnabled === true ? true : false}
                                    offColor="#909090"
                                    onColor="#24c6b1"
                                    size={30}
                                    draggable={true}
                                    translate={"yes"}
                                    handleDiameter={25}
                                    uncheckedIcon={
                                      <>
                                        <div className="manage-home-screen-toggle-unchecked-icon-status">{translate(TranslationEnum.common_portal,"INACTIVE")}</div>
                                      </>
                                    }
                                    checkedIcon={
                                      <>
                                        <div className="manage-home-screen-toggle-checked-icon-status">{translate(TranslationEnum.common_portal,"ACTIVE")}</div>
                                      </>
                                    }
                                    height={28}
                                    width={85}
                                  />
      default: return <></>

    }
  }
  const randomNum = Math.random();
  return (
    <table className='manage-block-drag-drop-table'>
      <thead className='manage-block-drag-drop-table-header'>
        <tr>
          {ManageHomePageConfig.columns.map((cell) => {
            return <th key={cell.headerName}>  {translate(TranslationEnum.manage_home_screen,cell.headerName)}</th>
          })}
        </tr>
      </thead>
      {props.data.length===0? <tbody>
          <tr>
              <td  className='manage-block-drag-drop-table-no-rows-message' colSpan={ManageHomePageConfig.columns.length}>No Data to display</td>
          </tr>
      </tbody> : 
      props.showNormalTable ? (
        <tbody>
          {props.data?.map((row: any, index: number) => (
            <tr key={index}>
              {ManageHomePageConfig.columns.map((cell) => (
                <td key={cell.headerName}>{renderTableCell(cell, row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      ):(
        <DragDropContext onDragEnd={handleDragOnEnd}>
        <Droppable droppableId='droppableTable'>
          {(provided) => (
            <tbody {...provided.droppableProps} ref={provided.innerRef}>
              {props.data?.map((row: any, index: number) => (
                <Draggable
                  key={index + randomNum}
                  draggableId={index + ""}
                  index={index}
                >
                  {(provided,snapshot) => (
                     <tr  ref={provided.innerRef} {...provided.draggableProps}  >
                      {ManageHomePageConfig.columns.map((cell) => {
                        if(cell.headerName)
                          return <td key={cell.headerName}>
                            {renderTableCell(cell,row)}
                          </td>
                        else return <td className="manage-block-drag-icon-cell" key={cell.headerName} {...provided.dragHandleProps}><FontAwesomeIcon icon={faGripLines} /></td>
                      })}
                   </tr>
                  )}
                </Draggable>
              ))}
             {provided.placeholder}
            </tbody>
          )}
        </Droppable>
      </DragDropContext>
      )
      
      }
    </table>
  );
};

export default DragDropTable;
