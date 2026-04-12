import { faArrowUpRightFromSquare, faCircleMinus, faCirclePlus, faEye, faGripLines, faHeartCircleMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useContentManagementConfig } from '@/provider';
import { BannerPreview } from '@/components/bannerPreview/BannerPreview';
import { Loader } from '@/components/loader/Loader';
import { ConfirmationPopUp } from '@/components/confirmationPopUp';
import { getAllBanners } from '../../services/bannerServices';
import { Banner, BannerElement, bannerMockData, getNewMetaDataConfig, transformFromSaleshubPayload } from '@/utils/UtilityService';
import { bannerTemplates } from '@/utils/sharedExports';
import { blockBannerSelectionProps } from './CreateBlockTypes';
import { openPopup } from '@/utils/UtilityService';
import GenricMultiSelect from '@/features/content-management/shared/GenericMultiSelect';
import { defaultTokenNew, tokenNew } from '@/utils/networkServiceSimple';
// import { createBucketNavigate, BannerSelectionProps } from './CreateBucketTypes';

function BlockBannerSelection(props:blockBannerSelectionProps) {
    
    const currentRoute = (useLocation().pathname);
    const navigate = useNavigate();
    const { routes } = useContentManagementConfig();
    // const locationState: createBucketNavigate = location.state as createBucketNavigate;
    const [bannerOptions,setBannerOptions] = useState<string[]>([]);
    const [selectedBanners,setSelectedBanners] = useState<string[]>([]);
    const needBasedBannersData = useRef<Banner[]>([]);
    const [currentBannerElements,setCurrentBannerElements] = useState<BannerElement[]>([]);
    const [openBannerPreview,setOpenBannerPreview] = useState<boolean>(false);
    const [openConfirmModal,setOpenConfirmModal] = useState<boolean>(false);
    const [openDeletConfirmModal,setOpenDeleteConfirmModal] = useState<boolean>(false);
    const targetBanner = useRef<Banner>();
    const deleteBanner = useRef<Banner>();
    const [showLoader,setShowLoader] = useState<boolean>(false);
    const allBannersRef = useRef<Banner[] | null>(null);
    const [openCreateModal,setOpenCreateModal] = useState<boolean>(false);
    useEffect(() => {
        async function getAndSetNeedBasedBanners(){
            setShowLoader(true);
            let allBanners: Banner[] | null = allBannersRef.current;
            if(!allBanners){
                const clientConfig = await getNewMetaDataConfig();
                let portal_config = clientConfig.find((config: any) => {
                    return config.domainType === "portal_configuration";
                })?.domainValues;
                const useSalesHubAPI = portal_config?.find(
                    (item) => item.name === "useSaleshub"
                )?.value ?? false;
                if(useSalesHubAPI){
                    try {
                        const resp = await fetch('https://api.salescodeai.com/banners', {
                          method: 'GET',
                          headers: {
                            'Content-Type': 'application/json',
                            'authorization': localStorage.getItem("auth_token") || defaultTokenNew,
                          },
                        });
                        if (resp.ok) {
                          const saleshubData = bannerMockData.length>0 ? bannerMockData : await resp.json();
                          // If API returns array, transform each
                          allBanners = transformFromSaleshubPayload(saleshubData);
                          console.log("banners",allBanners);
              
                        } else {
                            allBanners = [];
                        }
                      } catch (e) {
                        allBanners = [];
                      }
    
                }else{
                allBanners = await getAllBanners() as Banner[];
                }
                allBannersRef.current = allBanners;
            }
            
            // const templateFilteredBanners = allBanners.filter((banner: Banner) => {
            //     return props.bannerTemplates.includes(banner.bannerType);
            // })
            const templateFilteredBanners = allBanners.filter((banner: Banner) => {
                return props.bannerTemplates.some(template => {
                    if (template.startsWith("template")) {
                        return banner.bannerType === template;
                    }
                    if (template.startsWith("tvAdds")) {
                        return banner.bannerType === template;
                    }
                    if (template.startsWith("toggleBanner")) {
                        return banner.bannerType === template;
                    }
                    return banner?.extendedAttributes?.resolution?.label === template;
                });
            });
            
            let prevMappedBanner: string[] = [];
            const blockBannerIds = props.bannerIds
            const allBlocks = props.allBlocks;
            const bannerIdSet = new Set();
            allBlocks.forEach((blockObj: any) => {
                blockObj?.bannerIds?.forEach((id: string) => {
                    bannerIdSet.add(id);
                })
            })
            const bannersNotLinkedToBlocks = templateFilteredBanners.filter(bannerObj => {
                return !bannerIdSet.has(bannerObj.id);
            })
            let finalBannerState: Banner[] = [];
            if(props.showAllSelected){
                finalBannerState = bannersNotLinkedToBlocks
            }else{
                prevMappedBanner = bannersNotLinkedToBlocks.map((bannerObj) => bannerObj.bannerName);
            }

            if(props.view==="edit" && blockBannerIds){
                
                const prevSelectedBanners = blockBannerIds.map((bannerId: string) => {
                    return templateFilteredBanners.find((banner: Banner) => banner.id === bannerId);
                }).filter((banner: Banner | undefined) => banner!== undefined) as Banner[];

                finalBannerState = [...prevSelectedBanners,...finalBannerState,];
                // props.setBanners(bannerState as Banner[]);
            }
            props.setBanners(finalBannerState as Banner[]);
            setBannerOptions(prevMappedBanner);
            needBasedBannersData.current = templateFilteredBanners;
            setShowLoader(false);
        }
        getAndSetNeedBasedBanners();
    },[props.bannerTemplates]);
    function handleSelectBanners(selectedBannerOptions: string[]){
        setSelectedBanners(selectedBannerOptions);
    }
    function handleAddBanners(){
        props.setIsChange(true)
        const newNeedBasedBanners = selectedBanners.map((bannerName: string) => {
            return needBasedBannersData.current.find((bannerObj: any) => bannerObj.bannerName === bannerName);
        });
        const newBannerState = [...props.banners,...newNeedBasedBanners];
        props.setBanners(newBannerState as Banner[]);
        const newBannerOptions = bannerOptions.filter((bannerName: string) => {
            return !selectedBanners.find((selectedBannerName: string) => selectedBannerName === bannerName);
        })
        setSelectedBanners([]);
        setBannerOptions(newBannerOptions);
    }
    function handleDragOnEnd(result: DropResult) {
        if(result.destination!==null){
          const items = Array.from(props.banners);
          const [reorderedItem] = items.splice(result.source.index, 1);
          if (result.destination)
            items.splice(result.destination.index, 0, reorderedItem);
    
          props.setBanners(items);
        }
      }
    function handleBannerRemove(){
        props.setIsChange(true)
        const targetBanner = deleteBanner.current
        if(targetBanner){
            const newFilterdBanners = props.banners.filter((banner: Banner) => {
                return banner.bannerName !== targetBanner.bannerName;
            })
            props.setBanners(newFilterdBanners);
            setBannerOptions([targetBanner.bannerName,...bannerOptions]);
        }
    }
    function handleEye(targetBanner: Banner){
        setCurrentBannerElements(targetBanner.bannerElements);
        setOpenBannerPreview(true);
    }
    function navigateToEditBanner(){
        if(targetBanner.current){
            const bannerData = {...targetBanner.current, bannerTemplateType: bannerTemplates.find((bannerTemplate) => targetBanner.current?.bannerType === bannerTemplate.id)?.label};
            // setCurrentBanner(bannerData as bannerData);
            if(currentRoute.includes("/dashboard/")){
                navigate(routes.createBanner,{
                    state: {
                        isBucketEdit: true,
                        currentBanner: bannerData
                    }
                });
            }else{
                navigate(routes.createBanner,{
                    state: {
                        isBucketEdit: true,
                        currentBanner: bannerData
                    }
                })
            }
            
        }
    }
    return (
        !showLoader?<>
            {bannerOptions && <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <label>
                {props.label}
            </label>
            {/* {props.redirectToRef && <button style={{display:"flex",width:"fit-content",alignItems:"center",flexDirection:"row",gap:"15px"}} className="manage-home-screen-create-new create-block-input-fields" onClick={()=>{
                if(!props.currentBlock.current || props?.currentBlock?.current?.bannerVersion){
                    props.redirectToRef.current = "banner";
                    setOpenCreateModal(true)   
                }else{
                    openPopup("Error", "Banner upgraded. Please create new block");
                }
                }}>
                    <FontAwesomeIcon
                    fontSize={15}
                    icon={faPlus}
                />
                Create Banner
            </button>} */}
            </div>
            <div className="create-bucket-primary-types-row">
                <GenricMultiSelect
                    className="create-bucket-primary-type-multi-select"
                    options={bannerOptions}
                    label={""}
                    selectedOptions={selectedBanners}
                    handleMultiSelectState={handleSelectBanners}
                    isRequired={false}
                    params={{ size: "small" }}
                />
                <FontAwesomeIcon
                    onClick={handleAddBanners}
                    className="create-bucket-plus-icon"
                    icon={faCirclePlus}
                />
            </div></>}
            <BannerPreview openBannerPreview={openBannerPreview} setOpenBannerPreview={setOpenBannerPreview} bannerElements={currentBannerElements}/>
            {props.banners?.length>0 && <DragDropContext onDragEnd={handleDragOnEnd}>
            <Droppable droppableId="droppableNeedBasedBanners">
                {(provided) => (
                    <div className="create-bucket-need-based-banners-container" {...provided.droppableProps}
                    ref={provided.innerRef}>
                    {
                        props.banners.map((bannerObj: Banner,index: number) => {
                            return (
                                <Draggable 
                                    key={bannerObj.bannerName}
                                    draggableId={bannerObj.bannerName}
                                    index={index}
                                >
                                    {(provided) => (
                                        <div className='card' ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                            <div className="item_card" >
                                                <span>
                                                    <FontAwesomeIcon  className='transfer_list_grip_lines_icon' icon={faGripLines} />
                                                    {bannerObj.bannerName}
                                                </span>
                                                <span className='homepage_icon_container'>
                                                    <span onClick={() => handleEye(bannerObj)}>
                                                        <FontAwesomeIcon color={"#a48034"} icon={faEye} />
                                                    </span>
                                                        {props.view!=="create" && <span><FontAwesomeIcon color={"#2596be"} icon={faArrowUpRightFromSquare} onClick={()=>{
                                                            if(!props.currentBlock.current || props?.currentBlock?.current?.bannerVersion){
                                                                targetBanner.current = bannerObj as Banner;
                                                                setOpenConfirmModal(true) 
                                                            }else{
                                                                openPopup("Error", "Banner cannot be edited");
                                                            }
                                                            }} /></span>}
                                                    <span style={{display:"flex",alignItems:"center"}} onClick={() => {
                                                         setOpenDeleteConfirmModal(true);
                                                         deleteBanner.current=bannerObj
                                                    }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#b84444" stroke-width="1.8" width="16" height="16" className="bi bi-dash-circle" viewBox="0 0 16 16">
                                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14z" />
                                                            <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
                                                        </svg>

                                                        {/* <FontAwesomeIcon color={"#b84444"} icon={faCircleMinus} /> */}
                                                    </span>
                                                </span>
                                        </div>
                                        
                                    </div>
                                    )}
                                
                                </Draggable>
                            )
                        })
                    }
                    {provided.placeholder}
                    </div>
                )}
                </Droppable>
            </DragDropContext>}
            <ConfirmationPopUp
                openConfirmModal = {openConfirmModal}
                setOpenConfirmModal = {setOpenConfirmModal}
                message = {"You may have unsaved changes, Are you sure you want to navigate?"}
                successMethod = {navigateToEditBanner}
            />
            <ConfirmationPopUp
                openConfirmModal = {openDeletConfirmModal}
                setOpenConfirmModal = {setOpenDeleteConfirmModal}
                message = {"Are you sure you want to delete banner?"}
                successMethod = {handleBannerRemove}
            />
             <ConfirmationPopUp message="Are you sure you want to create banner?"
                    openConfirmModal={openCreateModal}
                    setOpenConfirmModal={setOpenCreateModal}
                    successMethod={props.handleSubmit}/>
        </>: <Loader />
    )
}

export default BlockBannerSelection;