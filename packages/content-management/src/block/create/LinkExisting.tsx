import { Autocomplete, Box, Button, Card, CardMedia, CircularProgress, TextField, Typography } from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
// import * as Sentry from "@sentry/react";
import { fetchAllBaskets, getAllBanners, getConfigFromClientConfig, getFinalBannerTemplates } from '../../services/bannerServices'
import { bannerTemplates } from '@/utils/sharedExports';
import { bucketDesigns } from '@/features/content-management/bucket/create/bucketTypes';
import { openPopup } from "@/utils/UtilityService";
import { fetchClientConfig, getClientConfigDomainType, getConfigKeyValue } from '../../services/manageHomeScreenService';
import { retailerAppLayoutConfigObj } from './CreateBlockTypes';
import { fetchAllBuckets } from '../../services/manageBucketService';
import { Banner } from '@/types';
import BlockBannerSelection from './BlockBannerSelection';
import { defaultBlockConfig } from '@/utils/UtilityService';
import { defaultBannerTemplate } from '@/features/content-management/banner/create/createNewBanner';
import { Loader } from '@/components/loader/Loader';
import { useNavigate } from 'react-router-dom';
import { ConfirmationPopUp } from '@/components/confirmationPopUp';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
const image1 = "";
import { getNewMetaDataConfig } from '@/utils/UtilityService';
import { OptionType } from '@/utils/UtilityService';
import { useSelector } from 'react-redux';
import { store } from '@/utils/UtilityService';

export default function LinkExisting({redirectToRef, blockState, handleParentDataSubmit, validateAllParentInputs, curBlockData, view,setIsChange,bannerBehaviourOptionValue,setBannerBehaviourOptionValue,currentBlock }: any) {
    
    const [bannerTypeIds, setBannerTypeIds] = useState<string[]>([]); 
    const bannerMapping = [
        { 
          resolution: "1024 X 376", 
          imgSrc: image1,
          id: "1024 X 376"
        },
        { 
          resolution: "500 X 416", 
          imgSrc: image1, 
          id: "500 X 416"
        },
        { 
          resolution: "1024 X 270", 
          imgSrc: image1, 
          id: "1024 X 270"
        },
        { 
          resolution: "1024 X 400", 
          imgSrc: image1, 
          id: "1024 X 400"
        },
         { 
          resolution: "1000 X 400", 
          imgSrc: image1, 
          id: "1000 X 400"
        },
        { 
          resolution: "1024 X 572", 
          imgSrc: image1, 
          id: "1024 X 572"
        },
        { 
          resolution: "300 X 420", 
          imgSrc: image1, 
          id: "300 X 420"
        },
        { 
          resolution: "210 X 240", 
          imgSrc: image1, 
          id: "210 X 240"
        }
      ];
      const filteredBannerMapping = bannerTypeIds.length > 0 
        ? bannerMapping.filter(option => bannerTypeIds.includes(option.id))
        : bannerMapping;
    const [optionType, setOptionType] = useState<any>([]);
    const [optionTypeValue, setOptionTypeValue] = useState<any>("");
    const [availableValue, setAvailableValue] = useState<string>("");
    const [optionId, setOptionId] = useState<string>("");
    const [optionAvailable, setOptionAvailable] = useState<any[]>([])
    const [showLoader, setShowLoader] = useState<boolean>(false);
    const [bodyId, setBodyId] = useState<string>("");
    const [bannerName, setBannerName] = useState<string>("")
    const [banners,setBanners] = useState<Banner[]>([]);
    const clientConfigRef = useRef<any[]>([]);
    const allBlocksRef = useRef<any[]>([]);
    const [compLoader,setCompLoader] = useState<boolean>(false);
    const navigate = useNavigate();
    const [openConfirmationModal,setOpenConfirmModal] = useState<boolean>(false);
    const [openCreateModal,setOpenCreateModal] = useState<boolean>(false);
    const bannerBehaviourOption = [
        { label: "Auto Play Video", id: "tvAdds" },
        { label: "Banner", id: "banner" },
        { label: "Toggle Banner", id: "toggleBanner" }
    ];
    const [useBeta, setUseBeta] = useState<boolean>(false);
    const savedRole:any = useSelector((state: any) => state.roleState.role)
    // const [bannerBehaviourOptionValue, setBannerBehaviourOptionValue] = useState<any>();
    const handlebannerBehaviour = (event: any, value: any) => {
        setBannerBehaviourOptionValue(value)
        if(value.id==="tvAdds"){
            setOptionTypeValue({ resolution: "tvAdds", id: "template20" });
            setOptionId("tvAdds");
        }else if(value.id==="toggleBanner"){
            setOptionTypeValue({ resolution: "toggleBanner", id: "template1234" });
            setOptionId("toggleBanner");
        }else{
            setOptionTypeValue({ resolution: "", id: "" });
            setOptionId("");
        }
    }

    const resolutionMapping = [
        { resolution: "1024 X 376", id: "template1" },
        { resolution: "1024 X 376", id: "template2" },
        { resolution: "1024 X 376", id: "template22" },
        { resolution: "1024 X 376", id: "template24" },
        { resolution: "1024 X 376", id: "template25" },
        { resolution: "1024 X 376", id: "template26" },
        { resolution: "1024 X 376", id: "template27" },
        { resolution: "1024 X 376", id: "template30" },
        { resolution: "1024 X 376", id: "template35" },
        { resolution: "1024 X 376", id: "template36" },
        { resolution: "1024 X 376", id: "template38" },
        { resolution: "1024 X 376", id: "template39" },
        { resolution: "1024 X 376", id: "template33" },
        { resolution: "500 X 416", id: "template3" },
        { resolution: "550 X 600", id: "template9" },
        { resolution: "500 X 416", id: "template123" },
        { resolution: "500 X 416", id: "template28" },
        { resolution: "500 X 416", id: "template34" },//promo
        { resolution: "1024 X 400", id: "template14" },
        { resolution: "1000 X 400", id: "template19" },
        { resolution: "1024 X 400", id: "template15" },
        { resolution: "1024 X 400", id: "template16" },
        { resolution: "1024 X 400", id: "template17" },
        { resolution: "1024 X 400", id: "template21" },
        { resolution: "300 X 420", id: "template29" },
        { resolution: "210 X 240", id: "template999" },
        { resolution: "1024 X 270", id: "template31" },
        { resolution: "1024 X 572", id: "template20" },
        { resolution: "1024 X 572", id: "template32" },
        { resolution: "1024 X 270", id: "template1234" },
    ];

    const handleTypeBanner = (event: any, value: any) => {
        setOptionId(value.resolution);
        setOptionTypeValue(value);
        setAvailableValue("");
    }
    const handleTypeBannerNew = (value: any) => {
        setOptionId(value.resolution);
        setOptionTypeValue(value);
        setAvailableValue("");
    }
    const handleTypeBucket = (event: any, value: any) => {
        setOptionId(value.id);
        setOptionTypeValue(value);
        setAvailableValue("");
    }

    const handleAvailable = (event: any, value: any) => {
        setBodyId(value.id);
        setBannerName(value.label)
        setAvailableValue(value.label);
        setIsChange(true)
    }

    const handleSubmit = async () => {
        
        try {
            let message = "";
            setShowLoader(true);
            if (validateAllParentInputs) message = validateAllParentInputs();
            if (message !== "") {
                openPopup("Alert", message);
                setShowLoader(false);
                return;
            }
            if (!optionTypeValue) {
                if (blockState?.type !== "Basket") {
                    message = `Please select the ${blockState?.type} type`;
                } 
            }
            // if ( !availableValue) {
            //     if (blockState?.type === "Basket") {
            //         message = `Please select the ${blockState?.type} available options`;
            //     } 
            // }
            if(view!=="create" && blockState.type!=="Banner" && (!availableValue || !bodyId) && redirectToRef.current===""){
                message = `Please select from the ${blockState?.type} options`;
            }
            // if (view!=="create" && !availableValue) {
            //     if (blockState?.type === "Basket") {
            //         message = `Please select the ${blockState?.type} available options`;
            //     } 
            // }
            if (message !== "") {
                openPopup("Alert", message);
                return;
            }
            let requestBody = {};
            
            if (blockState?.type === "Banner") {
                const bannerIds = banners.map((bannerObj) => bannerObj.id);
                requestBody = { bannerIds, bannerType: optionId };
                if(!optionId.startsWith("template")){
                    requestBody = { bannerIds, bannerType: optionId ,bannerVersion:"2.0"};
                }
            } else if (blockState?.type === "Bucket") {
                // requestBody = { bucketId: bodyId };
                requestBody = (view==="create"? { bucketDesign: optionTypeValue.id, bucketId: bodyId } : { bucketDesign: optionTypeValue.id, bucketId: bodyId })
            } else if (blockState?.type === "Basket") {
                requestBody = { basketId: bodyId };
                // requestBody = view ==="create"? { } : { basketId: bodyId };
            }

            handleParentDataSubmit && await handleParentDataSubmit(requestBody);

        } catch (err) {
            openPopup("Alert", "Some error occured")
        } finally {
            setShowLoader(false);
        }
    }
    useEffect(() => {
        async function getBannerBehaviourOption(){
            if(!clientConfigRef.current || clientConfigRef.current.length<=0){
                // const clientConfig = await getMetaDataConfig("clientconfig");
                const clientConfig = await getNewMetaDataConfig();
                clientConfigRef.current = clientConfig;
            }
            const bannerConfig= clientConfigRef.current?.find((config: any) => config.domainType === "banner_configuration")?.domainValues ?? [];
            const bannerBlockIDs = bannerConfig?.find((option: {name: string}) => {
                return option.name === "bannerBlockIDs"
            })
            if(bannerBlockIDs && bannerBlockIDs.value && bannerBlockIDs.value.length>0 ){
                setBannerTypeIds(bannerBlockIDs.value)
            }
        }
        getBannerBehaviourOption();
     }, []);
    useEffect(() => {
        async function init(){
            setCompLoader(true);
            const clientconfig = await fetchClientConfig();
            let betaConfig = clientconfig.find((config: any) => {
                return config.domainType === "beta_configuration";
            })?.domainValues;
            const betaBlocks = betaConfig?.find((configObj: retailerAppLayoutConfigObj) => {
                return configObj.name === "homeScreenBlockWidget";
            })?.value ?? [];
            let useBeta = false;
            if (Array.isArray(betaBlocks) && betaBlocks.length > 0) {
                setUseBeta(true);
                 
                useBeta = true;
            }
            const roleAppLayoutConfig = getClientConfigDomainType(clientconfig,`${savedRole?.id}_app_layout_configuration`);
            const blockConfig = useBeta ? betaBlocks : getConfigKeyValue(roleAppLayoutConfig,"homeScreenBlockWidget") ?? defaultBlockConfig[0].value;

            clientConfigRef.current = clientconfig;
            allBlocksRef.current = blockConfig;


            if(curBlockData?.id){
                if(curBlockData?.bannerType){
                    
                    const bannerResolution = resolutionMapping.find((bannerTemp) => bannerTemp.id === curBlockData?.bannerType);
                    if(!bannerResolution){
                        if(curBlockData?.bannerType==="tvAdds"){
                            setOptionTypeValue({ resolution: "tvAdds", id: "template20" });
                        }else if(curBlockData?.bannerType==="toggleBanner"){
                            setOptionTypeValue({ resolution: "toggleBanner", id: "template1234" });
                        }else{
                            const bannerResolution = resolutionMapping.find((bannerTemp) => bannerTemp.resolution === curBlockData?.bannerType);
                            setOptionTypeValue(bannerResolution);
                        }
                    }else{
                        setOptionTypeValue(bannerResolution);
                    }
                    const bannerTemplateObj = bannerTemplates.find((bannerTemp) => bannerTemp.id === curBlockData?.bannerType) ?? defaultBannerTemplate;
                    setOptionId(curBlockData?.bannerType);
                    // setOptionTypeValue(bannerTemplateObj);
                }
                if(curBlockData?.type==="Bucket" && curBlockData.bucketDesign){
                    const bucketDesignId = curBlockData.bucketDesign;
                    const bucketDesignObj = bucketDesigns.find((bucketDesignOption) => bucketDesignOption.id === curBlockData.bucketDesign);
                    if(bucketDesignObj) setOptionTypeValue(bucketDesignObj);
                    if(bucketDesignId) setOptionId(bucketDesignId);
                } 
            }
            setCompLoader(false);
        }
        init();
        
    },[])

    useEffect(() => {

        const getBasketData = async () => {
            try {
                const basketData = fetchAllBaskets(clientConfigRef.current);
                if(curBlockData?.id && curBlockData?.basketId){
                    const selectedBasket =basketData.find((basketObj: {id: string} ) => basketObj.id === curBlockData.basketId);
                    if(selectedBasket){
                        setBodyId(selectedBasket.id);
                        setAvailableValue(`${selectedBasket.id} - ${selectedBasket.title}`);
                    }
                }
                const blockFilterBasketData = basketData.filter((obj1: { id: any; }) => {
                    return !allBlocksRef.current.some((obj2: { basketId: string }) => obj2.basketId === obj1.id);
                });
                const formattedData = blockFilterBasketData.map((item: { title: string; id: string; }) => ({ label: item.title, id: item.id }));
                const formattedOptions = formattedData.map((option: { id: any; label: any; }) => ({
                    ...option,
                    label: `${option.id} - ${option.label}`
                }));
                setOptionAvailable(formattedOptions);
            } catch (err) {
                // Sentry.captureException(err);
            }
        }

        const getBucketData = async () => {
            try {
                const bucketData = getClientConfigDomainType(clientConfigRef.current,"bucket_configuration");
                if(curBlockData?.id && curBlockData?.bucketId){
                    const selectedBucket = bucketData[0].value.find((bucketObj: {id: string} ) => bucketObj.id === curBlockData.bucketId);
                    if(selectedBucket){
                        setBodyId(selectedBucket.id);
                        setAvailableValue(`${selectedBucket.id} - ${selectedBucket.title}`);
                    }
                }
                const blockFilterBucketData = bucketData[0].value.filter((obj1: { id: any; }) => {
                    return !allBlocksRef.current.some((obj2: { bucketId: string }) => obj2.bucketId === obj1.id);
                });
                const filteredBucketData = blockFilterBucketData.filter((item: { bucketDesign: string; }) => item.bucketDesign === optionId);
                const formattedData = filteredBucketData.map((item: { title: string; id: string; }) => ({ label: item.title, id: item.id }));
                const formattedOptions = formattedData.map((option: { id: any; label: any; }) => ({
                    ...option,
                    label: `${option.id} - ${option.label}`
                }));
                setOptionAvailable(formattedOptions);
            } catch (err) {
                // Sentry.captureException(err);
            }
        }

        const getBannerData = async () => {
            try {
                const clientconfig = clientConfigRef.current;
                const allBlocks = allBlocksRef.current;
                const bannerData: any[] = await getAllBanners();
                const bannerIdSet = new Set();
                const templateFilteredBanners = bannerData.filter(item => item.bannerType === optionId);
                allBlocks.forEach((blockObj: any) => {
                   blockObj?.bannerIds?.forEach((id: string) => {
                    bannerIdSet.add(id);
                   })
                })
                const blockFilterBannerData = templateFilteredBanners.filter(bannerObj => {
                    return !bannerIdSet.has(bannerObj.id);
                })
                const formattedData = blockFilterBannerData.map(item => ({ label: item.bannerName, id: item.id }));
                setOptionAvailable(formattedData)
            } catch (err) {
                // Sentry.captureException(err);
            }
        }
        if(clientConfigRef.current.length){
            // { blockState?.type === "Banner" && getBannerData() }
            { blockState?.type === "Bucket" && getBucketData() }
            { blockState?.type === "Basket" && getBasketData() }
        }
    }, [clientConfigRef.current,optionId, blockState?.type])

    useEffect(() => {
        if(clientConfigRef.current.length){
            if (blockState?.type === "Banner") {
                const tempBannerTemplates = getFinalBannerTemplates(clientConfigRef.current);
                const finalBannerTemplates = tempBannerTemplates.filter((bannerTemp) => bannerTemp.id !== "template34");
                setOptionType(finalBannerTemplates)
            }
            if (blockState?.type === "Bucket") {
                setOptionType(bucketDesigns)
            }
        }
        if(view==="create"){
            setOptionTypeValue("")
            setAvailableValue("")
            setOptionId("")
        }
    }, [clientConfigRef.current,blockState?.type])
    // console.log("optionAvailable:", optionAvailable)
    // console.log("optionType:", optionType)
    const selectedBannerTemplates = useMemo(() => {
        
        return curBlockData?.bannerType? [curBlockData.bannerType]: [optionId];
    },[optionId,curBlockData?.bannerType])
console.log("selectedBannerTemplates",selectedBannerTemplates,optionId,curBlockData)
    const isAvailableOptionDisabled = useMemo(() => {
        if(curBlockData?.id && curBlockData?.type){
            switch(curBlockData.type){
                // case "Bucket": {
                //     if(curBlockData?.id && curBlockData?.bucketId){
                //         const bucketData = getClientConfigDomainType(clientConfigRef.current,"bucket_configuration");
                //         const selectedBucket = bucketData?.[0]?.value?.find((bucketObj: {id: string} ) => bucketObj.id === curBlockData.bucketId);
                //         return Boolean(selectedBucket?.id)
                //     }
                //     return false;
                // }
                case "Basket": {
                    if(curBlockData?.id && curBlockData?.basketId){
                        const basketData = fetchAllBaskets(clientConfigRef.current);
                        const selectedBasket = basketData?.find((basketObj: {id: string} ) => basketObj.id === curBlockData.basketId);
                        return Boolean(selectedBasket?.id);
                    }
                    return false;
                }
            }
        }
        return false;
    },[curBlockData,clientConfigRef.current])

    return (
        <>
           {compLoader? <Loader /> : (<div className="create-basket-parent">
                <div className="create-basket-label">
                    <span>{blockState?.type ? blockState?.type : ""}</span>
                </div>
                <div className="create-basket-input-fields">
                {(blockState?.type === "Banner") && <>
                <label className="create-block-input-labels">BANNER BEHAVIOUR </label>
                        <Autocomplete
                            disableClearable
                            sx={{ width: "100%" }}
                            options={bannerBehaviourOption}
                            getOptionLabel={(option: any) => {
                               return option.label ?? ""
                            }}
                            disabled={view==="edit"}
                            value={bannerBehaviourOptionValue}
                            onChange={handlebannerBehaviour}
                            size="small"
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder={`Select Banner Behaviour`}
                                />
                            )}
                        />
                        {(bannerBehaviourOptionValue && bannerBehaviourOptionValue?.id ==="banner") && <>
                        <label className="create-block-input-labels">{blockState?.type.toUpperCase()} TYPE SELECTION </label>
                        {/* <Autocomplete
                            disableClearable
                            sx={{ width: "100%" }}
                            options={resolutionMapping.filter(
                                (item, index, self) =>
                                    index === self.findIndex((i) => i.resolution === item.resolution)
                            )}
                            getOptionLabel={(option: any) => {
                               return option.resolution ?? ""
                            }}
                            disabled={view==="edit"}
                            value={optionTypeValue}
                            onChange={handleTypeBanner}
                            size="small"
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder={`Select ${blockState?.type} Type`}
                                />
                            )}
                        /> */}
                            <TextField
                                disabled={view==="edit"}
                                variant="outlined"
                                sx={{ width: "100%" }}
                                value={optionTypeValue.resolution}
                            />
                            <Box sx={{ overflowX: 'scroll', height: '250px', display: 'flex' }}>
                                {filteredBannerMapping.map((option) => (
                                    <Box
                                        className="test"
                                        key={option.resolution}
                                        onClick={() => {
                                            if (view === "edit") return;
                                            handleTypeBannerNew(option);
                                        }}
                                        sx={{
                                            display: 'inline-block',
                                            padding: 1,
                                            cursor: (view === "edit") ? "not-allowed" : "pointer",
                                            border: optionTypeValue?.resolution === option.resolution ? "3px solid #ccc" : "",
                                            borderRadius: "8px",
                                            width: '250px',
                                            flexShrink: 0,
                                            transition: "border 0.3s ease",
                                            "&:hover": {
                                                border: (view === "edit") ? "1px solid #ccc" : "3px solid lightblue",
                                            },
                                            pointerEvents: (view === "edit") ? "none" : "auto",
                                        }}
                                    >
                                        <Card
                                            sx={{
                                                width: '100%',
                                                height: '80%',
                                                boxShadow: "none",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}
                                        >
                                            <CardMedia
                                                component="img"
                                                image={option.imgSrc!}
                                                title={option.resolution}
                                                sx={{
                                                    objectFit: "contain",
                                                    maxWidth: "100%",
                                                    maxHeight: "100%",
                                                }}
                                            />
                                        </Card>
                                        <Typography variant="body2" align="center" sx={{ marginTop: "8px", backgroundColor: "#F2F2F2", fontWeight: "500" }}>
                                            {option.resolution} px
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </> }
                    </>} 
                    {(blockState?.type !== "Basket" && blockState?.type !== "Banner") && <>
                        <label className="create-block-input-labels">{blockState?.type.toUpperCase()} TYPE SELECTION </label>
                        <Autocomplete
                            disableClearable
                            sx={{ width: "100%" }}
                            options={optionType}
                            getOptionLabel={(option: any) => {
                               return (option).displayName ?? option.label ?? ""
                            }}
                            disabled={view==="edit"}
                            value={optionTypeValue}
                            onChange={handleTypeBucket}
                            size="small"
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder={`Select ${blockState?.type} Type`}
                                />
                            )}
                        />
                    </>} 
                    {blockState?.type!=="Banner" && <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <label>AVAILABLE {blockState?.type?.toUpperCase()}</label>
                    {/* {blockState?.type === "Bucket" && <button style={{display:"flex",width:"fit-content",alignItems:"center",flexDirection:"row",gap:"15px"}}  className="manage-home-screen-create-new create-block-input-fields" onClick={()=>{
                    
                    redirectToRef.current = "bucket";
                    setOpenCreateModal(true)
                    }}>
                    <FontAwesomeIcon
                    fontSize={15}
                    icon={faPlus}
                />
                    Create Bucket
                    </button>} 
                    {blockState?.type === "Basket" && <button style={{display:"flex",width:"fit-content",alignItems:"center",flexDirection:"row",gap:"15px"}}  className="manage-home-screen-create-new create-block-input-fields" onClick={()=>{
                    
                    redirectToRef.current = "basket";
                    setOpenCreateModal(true)
                    }}>
                    <FontAwesomeIcon
                    fontSize={15}
                    icon={faPlus}
                />
                    Create Basket
                    </button>}  */}
                    </div>
                    <Autocomplete
                        disableClearable
                        sx={{ width: "100%" }}
                        disabled={isAvailableOptionDisabled}
                        options={optionAvailable}
                        value={availableValue}
                        onChange={handleAvailable}
                        // getOptionLabel={(option) => blockState?.type !== "Banner" ? `${option.id}-${option.label}` : option.label}
                        size="small"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder={`Select from Availabe ${blockState?.type}`}
                            />
                        )}
                    /></>}
                </div>
                {/* {blockState?.type === "Banner" && <button style={{display:"flex",width:"fit-content"}} className="manage-home-screen-create-new create-block-input-fields" onClick={()=>{
                    
                    redirectToRef.current = "banner";
                    handleSubmit();
                }}>
                Create Banner
                </button>}    */}
                {blockState?.type==="Banner" && optionTypeValue.id && clientConfigRef.current.length && <div className='create-block-input-fields'><BlockBannerSelection redirectToRef={redirectToRef} handleSubmit={handleSubmit} label='SELECT BANNERS' allBlocks={allBlocksRef.current} bannerIds={curBlockData?.bannerIds} banners={banners} setBanners={setBanners} bannerTemplates={selectedBannerTemplates} view={view} setIsChange={setIsChange} currentBlock={currentBlock} /></div>}
                <button
                    className="create-basket-submit create-basket-submit-active"
                    onClick={() => {redirectToRef.current="";setOpenConfirmModal(true)}}
                >
                    {showLoader ? (
                        <div>
                            <CircularProgress size={15} color="inherit" />
                            <span className="circular-progress-container ">SUBMIT</span>
                        </div>
                    ) : (
                        <>SUBMIT</>
                    )}
                </button> 
                <ConfirmationPopUp message="Are you sure you want to save?"
                    openConfirmModal={openConfirmationModal}
                    setOpenConfirmModal={setOpenConfirmModal}
                    successMethod={handleSubmit}/>

                <ConfirmationPopUp message={`Are you sure you want to create ${blockState?.type}?`}
                    openConfirmModal={openCreateModal}
                    setOpenConfirmModal={setOpenCreateModal}
                    successMethod={handleSubmit}/>
            </div>)}

        </>
    )
}
