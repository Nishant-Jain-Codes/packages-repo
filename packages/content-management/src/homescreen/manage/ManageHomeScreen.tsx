import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@/components/loader/Loader';
import DragDropTable from '@/features/content-management/homescreen/components/DragDropTable';
import { ConfirmationPopUp } from '@/components/confirmationPopUp';
import { GenericPopUp } from '@/components/popup/genericPopUp';
import { deleteBanner, getAllBanners, getConfigFromClientConfig } from '../../services/bannerServices';
// import { updateBasket } from '@/features/content-management/services/manageBasketService';
// import { updateBucketConfig } from '@/features/content-management/services/manageBucketService';
import { fetchClientConfig, getClientConfigDomainType, getWholeSellerConfiguration,  updateWholeSellerConfiguration } from '@/features/content-management/services/manageHomeScreenService';
import { metaDataBatchPayload, popupType } from '@/types';
import { basketRequestBody } from '@/features/content-management/basket/manage/ManageBasketTypes';
import { manageBlockAction, ManageHomeScreenProps, OptionType } from './ManageHomePageTypes';
import './ManageHomeScreen.css';
import previewImage from '../../assets/images/png/PreviewImage.png'
import { defaultBlockConfig } from './ManageHomeScreenConfig';
import { retailerAppLayoutConfigObj } from '@/features/content-management/block/create/CreateBlockTypes';
import { TranslationEnum, usePortalTranslation } from '@/utils/TranslationProvider';
// import { eventEnum, logEvent } from '@/utils/eventService';
import BackButton from '@/utils/BackButton';
import { validateWithOtp } from '@/utils/validateOtpPopupActions';
import { bannerMockData, getNewMetaDataConfig, transformFromSaleshubPayload, updateConfigRequestBody } from '@/utils/UtilityService';
import { manageUpdateAccessObj } from '@/utils/UtilityService';
import { defaultTokenNew, META_DATA_BATCH_API, tokenNew } from '@/utils/networkServiceSimple';
import { getMetaDataConfig, validateMetaDataResponse } from '@/utils/UtilityService';
import { getLob } from '@/utils/UtilityService';
import { useSelector } from 'react-redux';
import { store } from '@/utils/UtilityService';
import axios from 'axios';

function ManageHomeScreen(props: ManageHomeScreenProps) {
  const [useBeta, setUseBeta] = useState<boolean>(false);
  const { translate } = usePortalTranslation();
  const CUR_COMPONENT = "Manage Home Screen"

  const [showLoader,setShowLoader] = useState<boolean>(false);
  const [blocks,setBlocks] = useState<any[]>([]);
  const [blockConfiguration,setBlockConfiguration] = useState<any>({});
  const [bucketConfiguration,setBucketConfiguration] = useState<any>({});
  const [basketConfiguration,setBasketConfiguration] = useState<any>({});
  const [blockAction,setBlockAction] = useState<manageBlockAction>("activeStatusChange");

  const [confirmPopupMessage,setConfirmPopupMessage] = useState<string>("");
  const [openConfirmPopup,setOpenConfirmPopup] = useState<boolean>(false);

  const [popupAction,setPopupAction] = useState<popupType>("Alert");
  const [openGenericModal,setOpenGenericModal] = useState<boolean>(false);
  const [genericModalMessage,setGenericModalMessage] = useState<string>("");
  
  const [currentBlockData,setCurrentBlockData] = useState<any>({});
  const [saveSequenceLoader,setSaveSequenceLoader] = useState<boolean>(false);
  const clientConfigRef = useRef<any[]>([]);
  const allBanners = useRef<any[] | null>(null);
  const navigate = useNavigate();
  const savedRole:any = useSelector(() => store.getState().roleState.role)
  console.log("savedRole",savedRole) 
  const [roleOptions, setRoleOptions] = useState<OptionType[]>([]);
  const [wholeSellerConfig, setWholeSellerConfig] = useState<boolean>(false);
      useEffect(() => {
      const fetchPortalConfig = async () => {
        const clientConfig = await getNewMetaDataConfig();
        const portalConfig = clientConfig?.find((config: any) => config.domainType === "portal_configuration")?.domainValues ?? [];
        const wholeSellerConfig = portalConfig?.find((item) => item.name === "wholeSellerConfig")?.value ?? false; 
        setWholeSellerConfig(wholeSellerConfig);  
      };
      fetchPortalConfig();
    }, [savedRole]);

  async function deleteInnerComponent(targetBlock: any,action: manageBlockAction){
    switch(targetBlock.type){
      case "Basket": {
        const newBasketConfiguration = [...basketConfiguration];
        const baskets = newBasketConfiguration[0].value;
        const currentBasket = baskets.find((basket:any) => basket.id === targetBlock.basketId);
        if(currentBasket){
          const changedBaskets = baskets.filter((basket: any) => {
            return basket.id !== targetBlock.basketId
          })
          newBasketConfiguration[0].value = changedBaskets;
          const requestBody: basketRequestBody = {
            domainName: "clientconfig",
            domainType: "order_basket_configuration",
            domainValues: newBasketConfiguration,
            lob: JSON.parse(localStorage.authContext).user.lob,
          }
          // const response = await updateBasket("order_basket_configuration",requestBody);
          // if(response.status===200 || response.status===201){
          //   return true;
          // }else{
          //   setGenericModalMessage(`Bucket linked with block does not exist now`);
          //   setPopupAction("Success");
          //   setOpenGenericModal(true);
          //   return false;
          // }
        }
        break;
      }
      case "Bucket": {
        const newBucketConfiguration = [...bucketConfiguration];
        const buckets = newBucketConfiguration[0].value;
        const currentBucket = buckets.find((bucket:any) => bucket.id === targetBlock.bucketId);
        if(currentBucket){
          const changedBuckets = buckets.filter((bucket: any) => {
          return bucket.id !== targetBlock.bucketId
          })
          newBucketConfiguration[0].value = changedBuckets;
          const requestBody = {
            domainName: "clientconfig",
            domainType: "bucket_configuration",
            domainValues: newBucketConfiguration,
            lob: getLob(),
          }
          const response = await axios.post(
            "https://salescode-marketplace.salescode.ai/configuration/update",
            requestBody,
            {
              headers: {
                lob: getLob(),
                "Content-Type": "application/json",
              },
            }
          );
          if (response.status === 200 || response.status === 201) {
              return true;
          }else{
            setGenericModalMessage(`Something went wrong while deleting bucket data`);
            setPopupAction("Success");
            setOpenGenericModal(true);
            return false;
          }
         
        }else{
          setGenericModalMessage(`Bucket linked with block does not exist now`);
          setPopupAction("Success");
          setOpenGenericModal(true);
          return false;
        }
      }
      case "Banner": {
        // const bannerReponse = await deleteBanner(targetBlock.bannerName);
        // if(bannerReponse.success){
        //   return true;
        // }else{
        //   setGenericModalMessage(`Something went wrong while deleting banner data`);
        //   setPopupAction("Success");
        //   setOpenGenericModal(true);
        //   return false;
        // }
        return true; //banner delete logic removed
      }
      default: {
        //if it has no inner component return true 
        return true;
      }
    }
  }
  async function updateBlock(allBlocks:any[],targetBlock: any,action: manageBlockAction){
    try{
        const newBlockConfiguration = [...blockConfiguration];
        const newAllBlocks = action==='activeStatusChange'? (allBlocks.map((block:any) => {
            if(block.id === targetBlock.id){
                return {...targetBlock, statusEnabled: !targetBlock.statusEnabled};
            }else{
                return block;
            }
        })):(allBlocks.filter((block:any) => {
          return block.id!==targetBlock.id;
        }));
        const homeScreenIndex = newBlockConfiguration.findIndex((configObj) => configObj.name === "homeScreenBlockWidget");
        if(homeScreenIndex!==-1){
          newBlockConfiguration[homeScreenIndex].value = newAllBlocks;
        }else{
          newBlockConfiguration.push({
            ...defaultBlockConfig,
            value: newAllBlocks
          })
        }
        const blockDataPayload: updateConfigRequestBody = {
            domainName: "clientconfig",
            domainType: `${savedRole?.id}_app_layout_configuration`,
            domainValues: newBlockConfiguration,
            lob: getLob()
        }
      const betaBlockDataPayload: updateConfigRequestBody = {
        domainName: "clientconfig",
        domainType: "beta_configuration",
        domainValues: newBlockConfiguration,
        lob: getLob(),
      }
      let finalPaylod = useBeta ? betaBlockDataPayload : blockDataPayload;
        const finalMetaDataPayload: metaDataBatchPayload = { features: [finalPaylod] };
        const wholeSellerLayoutConfig = getClientConfigDomainType(clientConfigRef.current,"wholesaler_app_layout_configuration");
        if(wholeSellerLayoutConfig && wholeSellerConfig){
            const wholeSellerConfigData = await getWholeSellerConfiguration(clientConfigRef.current,newBlockConfiguration);
            if(wholeSellerConfigData && wholeSellerConfig){
              finalMetaDataPayload.features.push(wholeSellerConfigData);
            }
        }
        try {
          const response = await axios.post(
            "https://salescode-marketplace.salescode.ai/configuration/update",
            finalMetaDataPayload,
            {
              headers: {
                lob: getLob(),
                "Content-Type": "application/json",
              },
            }
          );
          if (response.status >= 200 || response.status < 300) {
            if(action === "activeStatusChange"){
              setGenericModalMessage(translate(TranslationEnum.manage_home_screen, `Block with id: {blockID} ${targetBlock.statusEnabled? "deactivated" : "activated"} successfully`,{"blockID":targetBlock.id}));
            }else{
              setGenericModalMessage(translate(TranslationEnum.manage_home_screen, `Block with id: {blockID} deleted successfully`,{"blockID":targetBlock.id}));
            }
            setPopupAction("Success");
            getAndSetBlocks();
          }else{
            setPopupAction("Error");
            setGenericModalMessage("Something went wrong while updating block data");
            setOpenGenericModal(true);
          }
        } catch (error) {
          console.log(error);
          setPopupAction("Error");
          setGenericModalMessage("Something went wrong while updating block data");
          setOpenGenericModal(true);
        }
        // validateWithOtp((verfiedUser?: manageUpdateAccessObj,verifyResponse?: any) => {
        //   if (verifyResponse.status > 200 || verifyResponse.status < 300) {
        //     const validationObj = validateMetaDataResponse(verifyResponse?.data?.features);
        //     if(validationObj.success){
        //       if(action === "activeStatusChange"){
        //         setGenericModalMessage(translate(TranslationEnum.manage_home_screen, `Block with id: {blockID} ${targetBlock.statusEnabled? "deactivated" : "activated"} successfully`,{"blockID":targetBlock.id}))
        //       }else{
        //         // const result = await deleteInnerComponent(targetBlock,action);
        //         setGenericModalMessage(translate(TranslationEnum.manage_home_screen, `Block with id: {blockID} deleted successfully`,{"blockID":targetBlock.id}));
        //       }
        //       setPopupAction("Success");
        //       getAndSetBlocks();
        //     }else{
        //       setPopupAction("Error");
        //       setGenericModalMessage(validationObj.message)
        //     }
        //     setOpenGenericModal(true);
        //   }else{
        //     setPopupAction("Error");
        //     setGenericModalMessage("Something went wrong!")
        //     setOpenGenericModal(true);
        //   }
        // },undefined,"all",META_DATA_BATCH_API,finalMetaDataPayload,"PUT");
    }catch(err){
      console.log(err);
      setPopupAction("Error");
      setGenericModalMessage("Something went wrong!")
      setOpenGenericModal(true);
    }
}
  async function getAndSetBlocks(){
    setShowLoader(true);
    const clientConfig = await fetchClientConfig();
    clientConfigRef.current = clientConfig;
    let betaConfig = clientConfigRef.current.find((config: any) => {
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
    const blockConfig = clientConfig.find((Obj: { domainType: string }) => {
        return Obj.domainType === `${savedRole?.id}_app_layout_configuration`
    })?.domainValues ?? defaultBlockConfig;
    const allBlocks = useBeta ? betaBlocks : blockConfig.find((configObj: retailerAppLayoutConfigObj) => {
      return configObj.name === "homeScreenBlockWidget";
    })?.value ?? [];
    setBlocks(allBlocks);
    setBlockConfiguration(useBeta ? (betaConfig ?? []) : blockConfig);
    const bucketConfig = clientConfig.find((Obj: { domainType: string }) => {
        return Obj.domainType === 'bucket_configuration'
    })?.domainValues;
    setBucketConfiguration(bucketConfig);

    const basketConfig = clientConfig.find((Obj: { domainType: string }) => {
        return Obj.domainType === 'order_basket_configuration'
    })?.domainValues;
    let portal_config = clientConfig.find((config: any) => {
        return config.domainType === "portal_configuration";
    })?.domainValues;
    const useSalesHubAPI = portal_config?.find(
        (item) => item.name === "useSaleshub"
    )?.value ?? false;
    let banners;
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
              banners = transformFromSaleshubPayload(saleshubData);
  
            } else {
              banners = [];
            }
          } catch (e) {
            banners = [];
          }

    }else{
        banners = await getAllBanners();
    }
    allBanners.current = banners;
    setBasketConfiguration(basketConfig);
    
    setShowLoader(false);
  }
  async function saveSequence(){
    try{
      setSaveSequenceLoader(true);
      const newBlockConfiguration = [...blockConfiguration];
      const newAllBlocks = [...blocks];
      const homeScreenIndex = newBlockConfiguration.findIndex((configObj) => configObj.name === "homeScreenBlockWidget");
        if(homeScreenIndex!==-1){
          newBlockConfiguration[homeScreenIndex].value = newAllBlocks;
        }else{
          newBlockConfiguration.push({
            ...defaultBlockConfig,
            value: newAllBlocks
          })
        }
      const blockDataPayload: updateConfigRequestBody = {
        domainName: "clientconfig",
        domainType: `${savedRole?.id}_app_layout_configuration`,
        domainValues: newBlockConfiguration,
        lob: getLob(),
    }
    setSaveSequenceLoader(false);
    const finalMetaDataPayload: metaDataBatchPayload = { features: [blockDataPayload] };
    const wholeSellerLayoutConfig = getClientConfigDomainType(clientConfigRef.current,"wholesaler_app_layout_configuration");
    if(wholeSellerLayoutConfig && wholeSellerConfig){
        const wholeSellerConfigData = await getWholeSellerConfiguration(clientConfigRef.current,newBlockConfiguration);
        if(wholeSellerConfigData && wholeSellerConfig){
          finalMetaDataPayload.features.push(wholeSellerConfigData);
        }
    }
    try {
      const response = await axios.post(
        "https://salescode-marketplace.salescode.ai/configuration/update",
        finalMetaDataPayload,
        {
          headers: {
            lob: getLob(),
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status >= 200 && response.status < 300) {
        setGenericModalMessage(`Sequence saved successfully`);
        setPopupAction("Success");
        getAndSetBlocks();
      }else{
        setPopupAction("Error");
        setGenericModalMessage("Something went wrong while saving sequence!");
        setOpenGenericModal(true);
      }
    }catch(err){
      console.log(err);
      setSaveSequenceLoader(false);
      setPopupAction("Error");
      setGenericModalMessage("Something went wrong while saving sequence!");
      setOpenGenericModal(true);
    }
    // validateWithOtp((verifiedUser?: manageUpdateAccessObj,verifyResponse?: any) => {
    //   if (verifyResponse.status >= 200 && verifyResponse.status < 300) {
    //     const validationObj = validateMetaDataResponse(verifyResponse?.data?.features);
    //     if(validationObj.success){
    //       setGenericModalMessage(`Sequence saved successfully`);
    //       setPopupAction("Success");
    //       getAndSetBlocks();
    //     }else{
    //       setPopupAction("Error");
    //       setGenericModalMessage(validationObj.message)
    //     }
    //     setOpenGenericModal(true);
    //   }else{
    //     setPopupAction("Error");
    //     setGenericModalMessage("Something went wrong while saving sequence!")
    //     setOpenGenericModal(true);
    //   }
    // },undefined,"all",META_DATA_BATCH_API,finalMetaDataPayload,"PUT");
    
    }catch(err){
      console.log(err);
      setSaveSequenceLoader(false);
      setPopupAction("Error");
      setGenericModalMessage("Something went wrong while saving sequence!")
      setOpenGenericModal(true);
    }
    
  }
  useEffect(() => {
    getAndSetBlocks();
  },[savedRole])

  return (
    <div className='manage-home-screen-parent'>
        {!showLoader?
          <div className='manage-home-screen-table-preview-container'>
            <div className='manage-home-screen-table'>
              <div className="manage-home-screen-header">
        <div className="manage-home-screen-label">
            <span>{translate(TranslationEnum.manage_home_screen,"Manage Blocks")}</span>
        </div>
        <div className="manage-home-screen-buttons">
           {/* {blocks.length!==0 && <button className="manage-home-screen-back" disabled={saveSequenceLoader} onClick={() => saveSequence()}>
            {saveSequenceLoader?<div className="manage-home-screen-save-button-progress"><CircularProgress size={15} color="inherit"/>{translate(TranslationEnum.manage_home_screen,"SAVE SEQUENCE")}</div> : <>{translate(TranslationEnum.manage_home_screen,"SAVE SEQUENCE")}</> }
            </button>} */}
            <button
              className="manage-home-screen-create-new"
              onClick={() => {
                 navigate('/create-block',{
                  state: {
                    step: 'create-block',
                    blocks,
                    blockConfiguration,
                    buckets: bucketConfiguration?.[0]?.value,
                    bucketConfiguration,
                    row: {
                      id: "",
                      tag: "",
                      type: "",
                      title: "",
                      tagColor: "",
                      subtitle: "",
                      status: "",
                      backgroundImageBlobKey: "",
                      displayImageBlobKey: "",
                      basketTitleIconBlobKey: "",
                      backGroundColor:""
                    },
                    domainValues: basketConfiguration
                  }
                });
              }}
              >
              {translate(TranslationEnum.manage_home_screen,"Create Block")}
            </button>
            {!props.hideBackButton && <div><BackButton /></div>}
        </div>
    </div>
              <DragDropTable showNormalTable={true} data={blocks} setData={setBlocks} setConfirmPopupMessage={setConfirmPopupMessage} setOpenConfirmPopup={setOpenConfirmPopup} setCurrentBlockData={setCurrentBlockData} setBlockAction={setBlockAction} blockConfiguration={blockConfiguration} basketConfiguration={basketConfiguration} bucketConfiguration={bucketConfiguration} setShowLoader={setShowLoader} 
                setPopupAction = {setPopupAction}
                setGenericModalMessage = {setGenericModalMessage}
                setOpenGenericModal = {setOpenGenericModal} />
            </div>
            {/* {!props.hidePreview && <div className='manage-home-screen-preview'>
              <iframe src={`https://${lob}.salescode.ai/#/`} title="App Preview"  className="app_preview"></iframe>
            </div>} */}
          </div>
          : <Loader />}
          <ConfirmationPopUp
          openConfirmModal={openConfirmPopup}
          message={confirmPopupMessage}
          setOpenConfirmModal={() => {
            setOpenConfirmPopup(false);
          }}
          successMethod={() => {
              updateBlock(blocks,currentBlockData,blockAction);
          }}
        />
         <GenericPopUp
          type={popupAction}
          message={genericModalMessage}
          setOpenGenericModal={setOpenGenericModal}
          openGenericModal={openGenericModal}
      />
</div>
    
  )
}

export default ManageHomeScreen;