import { faArrowUpRightFromSquare, faCircleMinus, faCirclePlus, faEye, faGripLines, faHeartCircleMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { useLocation, useNavigate } from 'react-router-dom';
import { BannerPreview } from '@/components/bannerPreview/BannerPreview';
import GenricMultiSelect from '@/features/content-management/shared/GenericMultiSelect';
import { Loader } from '@/components/loader/Loader';
import { ConfirmationPopUp } from '@/components/confirmationPopUp';
import { getAllBanners } from '../../services/bannerServices';
import { Banner, BannerElement, bannerMockData, getNewMetaDataConfig, transformFromSaleshubPayload } from '@/utils/UtilityService';
import { bannerTemplates } from '@/utils/sharedExports';
import { createBucketNavigate, BannerSelectionProps } from './CreateBucketTypes';
import { fetchAllBuckets } from '../../services/manageBucketService';
import { defaultTokenNew, tokenNew } from '@/utils/networkServiceSimple';

function BannerSelection(props: BannerSelectionProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const locationState: createBucketNavigate = location.state as createBucketNavigate;
    const [bannerOptions,setBannerOptions] = useState<string[]>([]);
    const [selectedBanners,setSelectedBanners] = useState<string[]>([]);
    const needBasedBannersData = useRef<Banner[]>([]);
    const [currentBannerElements,setCurrentBannerElements] = useState<BannerElement[]>([]);
    const [openBannerPreview,setOpenBannerPreview] = useState<boolean>(false);
    const [openConfirmModal,setOpenConfirmModal] = useState<boolean>(false);
    const targetBanner = useRef<Banner>();
    const [showLoader,setShowLoader] = useState<boolean>(false);
    useEffect(() => {
        async function getAndSetNeedBasedBanners(){
            setShowLoader(true);
            const clientConfig = await getNewMetaDataConfig();
            let portal_config = clientConfig.find((config: any) => {
                return config.domainType === "portal_configuration";
            })?.domainValues;
            const useSalesHubAPI = portal_config?.find(
                (item) => item.name === "useSaleshub"
            )?.value ?? false;
            let allBanners;
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
                allBanners = await getAllBanners();
            }
            const needBasedBanners = allBanners.filter((banner: Banner) => {
                const isTemplateMatch = props.bannerTemplates.includes(banner.bannerType);

                const isBucketBannerMatch =
                    banner.bannerType === "bucketBanner" &&
                    banner?.extendedAttributes?.resolution?.label === props.resolution;

                return isTemplateMatch || isBucketBannerMatch;
            });
            let needBasedBannerOptions = [];
            const bucketBannerIds = locationState.currentBucket?.bannerIds as string[];
            let bucketConfig = await fetchAllBuckets();
            const allBuckets = locationState.buckets ?? bucketConfig[0].value;
            
            needBasedBannerOptions = needBasedBanners.filter((banner: Banner) => { //for removing all the previosly linked need based banners
                const isPresentInOtherBuckets = allBuckets.find((bucket: any) => { 
                    if(bucket.bannerIds){
                        return bucket.bannerIds.includes(banner.id);
                    }else if(bucket.bannerId){
                        return bucket.bannerId === banner.id;
                    }else{
                        return false;
                    }
                })
                return !isPresentInOtherBuckets;
            }).map((banner: Banner) => banner.bannerName);
            if(props.view==="edit" && bucketBannerIds){
                const bannerState = bucketBannerIds.map((bannerId: string) => {
                    return needBasedBanners.find((banner: Banner) => banner.id === bannerId);
                }).filter((banner: Banner | undefined) => banner!== undefined);

                props.setSelectedPrimaryTypesState(bannerState as Banner[]);
            }
            setBannerOptions(needBasedBannerOptions);
            needBasedBannersData.current = needBasedBanners;
            setShowLoader(false);
        }
        getAndSetNeedBasedBanners();
    },[]);
    function handleSelectBanners(selectedBannerOptions: string[]){
        setSelectedBanners(selectedBannerOptions);
    }
    function handleAddBanners(){
        const newNeedBasedBanners = selectedBanners.map((bannerName: string) => {
            return needBasedBannersData.current.find((bannerObj: any) => bannerObj.bannerName === bannerName);
        })
        const newBannerState = [...props.selectedPrimaryTypesState,...newNeedBasedBanners];
        props.setSelectedPrimaryTypesState(newBannerState as Banner[]);
        const newBannerOptions = bannerOptions.filter((bannerName: string) => {
            return !selectedBanners.find((selectedBannerName: string) => selectedBannerName === bannerName);
        })
        setSelectedBanners([]);
        setBannerOptions(newBannerOptions);
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
    function handleBannerRemove(targetBanner: Banner){
        const newFilterdBanners = props.selectedPrimaryTypesState.filter((banner: Banner) => {
            return banner.bannerName !== targetBanner.bannerName;
        })
        props.setSelectedPrimaryTypesState(newFilterdBanners);
        setBannerOptions([targetBanner.bannerName,...bannerOptions]);
    }
    function handleEye(targetBanner: Banner){
        setCurrentBannerElements(targetBanner.bannerElements);
        setOpenBannerPreview(true);
    }
    function navigateToEditBanner(){
        if(targetBanner.current){
            const bannerData = {...targetBanner.current, bannerTemplateType: bannerTemplates.find((bannerTemplate) => targetBanner.current?.bannerType === bannerTemplate.id)?.label};
            // setCurrentBanner(bannerData as bannerData);
            if (bannerData?.extendedAttributes?.bannerV2) {
                navigate("/create-banner", {
                    state: {
                        isBucketEdit: true,
                        currentBanner: bannerData
                    }
                });
            } else {
                navigate("/create-banner", {
                    state: {
                        isBucketEdit: true,
                        currentBanner: bannerData
                    }
                });
            }
        }
    }
    return (
        !showLoader?<>
            <label className="create-basket-input-labels">
                {props.label}
            </label>
            <div className="create-bucket-primary-types-row">
                <GenricMultiSelect
                    className="create-bucket-primary-type-multi-select"
                    options={bannerOptions}
                    label={`Select ${props.label}`}
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
            </div>
            <BannerPreview openBannerPreview={openBannerPreview} setOpenBannerPreview={setOpenBannerPreview} bannerElements={currentBannerElements}/>
            {props.selectedPrimaryTypesState?.length>0 && <DragDropContext onDragEnd={handleDragOnEnd}>
            <Droppable droppableId="droppableNeedBasedBanners">
                {(provided) => (
                    <div className="create-bucket-need-based-banners-container" {...provided.droppableProps}
                    ref={provided.innerRef}>
                    {
                        props.selectedPrimaryTypesState.map((bannerObj: Banner,index: number) => {
                            return (
                                <Draggable 
                                    key={bannerObj.bannerName}
                                    draggableId={bannerObj.bannerName}
                                    index={index}
                                >
                                    {(provided, snapshot) => (
                                        <div 
                                            className='card' 
                                            ref={provided.innerRef} 
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={{
                                                ...provided.draggableProps.style,
                                                opacity: snapshot.isDragging ? 0.8 : 1,
                                                cursor: 'grab',
                                            }}
                                        >
                                            <div className="item_card" >
                                                <span>
                                                    <FontAwesomeIcon  className='transfer_list_grip_lines_icon' icon={faGripLines} />
                                                    {bannerObj.bannerName}
                                                </span>
                                                <span className='homepage_icon_container'>
                                                    <span onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEye(bannerObj);
                                                    }}>
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </span>
                                                    <span onClick={(e) => {
                                                        e.stopPropagation();
                                                        targetBanner.current = bannerObj as Banner;
                                                        setOpenConfirmModal(true);
                                                    }}>
                                                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                                                    </span>
                                                    <span onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBannerRemove(bannerObj);
                                                    }}>
                                                        <FontAwesomeIcon icon={faCircleMinus} />
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
        </>: <Loader />
    )
}

export default BannerSelection;