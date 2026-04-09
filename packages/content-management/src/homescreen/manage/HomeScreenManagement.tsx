import { Autocomplete, Box, Button, CircularProgress, TextField } from '@mui/material';
import Checkbox from "@mui/material/Checkbox";
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@/components/loader/Loader';
import HomeScreenDragDropTable from '@/features/content-management/homescreen/components/HomeScreenDragDropTable';
import { ConfirmationPopUp } from '@/components/confirmationPopUp';
import { GenericPopUp } from '@/components/popup/genericPopUp';
import { deleteBanner, getAllBanners, getConfigFromClientConfig } from '../../services/bannerServices';
// import { updateBasket } from '@/features/content-management/services/manageBasketService';
// import { updateBucketConfig } from '../../services/manageBucketService';
import { fetchClientConfig } from '@/features/content-management/services/manageHomeScreenService';
import { metaDataBatchPayload, popupType } from '@/types';
import { basketRequestBody } from '@/features/content-management/basket/manage/ManageBasketTypes';
import { manageBlockAction, ManageHomeScreenProps, OptionType } from './ManageHomePageTypes';
import './ManageHomeScreen.css';
import { defaultBlockConfig } from './ManageHomeScreenConfig';
import { retailerAppLayoutConfigObj } from '@/features/content-management/block/create/CreateBlockTypes';
import { TranslationEnum, usePortalTranslation } from '@/utils/TranslationProvider';
import BackButton from '@/utils/BackButton';
import { getNewMetaDataConfig, transformFromSaleshubPayload, updateConfigRequestBody, validateMetaDataResponse } from '@/utils/UtilityService';
import { getLob } from '@/utils/UtilityService';
import axios from "axios";
import { useSelector } from 'react-redux';
import { store } from '@/utils/UtilityService';
import cloneDeep from 'lodash.clonedeep';
import { validateWithOtp } from '@/utils/validateOtpPopupActions';
import { manageUpdateAccessObj } from '@/utils/UtilityService';
import { defaultTokenNew, META_DATA_BATCH_API } from '@/utils/networkServiceSimple';
// import PhoneFrameComponent from '@/components/onboarding/PhoneFrame';
// import ReloadButton from '@/components/salescodeStudio/mandatoryConfigs/uiThemeConfig/widgets/reloadButton';

function HomeScreenManagement(props: ManageHomeScreenProps) {
    const [useBeta, setUseBeta] = useState<boolean>(false);
    const currentUserData = JSON.parse(localStorage.getItem("authContext") ?? "{}")?.user;
    const isAdmin = currentUserData?.designation.includes("admin");
    const isReportAdmin = currentUserData?.designation.includes("reportadmin");
    const { translate } = usePortalTranslation();
    const CUR_COMPONENT = "Manage Home Screen"
    const lob = localStorage.getItem("lob");

    const [showLoader, setShowLoader] = useState<boolean>(false);
    const [blocks, setBlocks] = useState<any[]>([]);
    const [testBlocks, setTestBlocks] = useState<any[]>([]);
    const [disabledBlocks, setDisabledBlocks] = useState<any[]>([]);
    const [enabledBlocks, setEnabledBlocks] = useState<any[]>([]);
    const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
    const [tempSelectedBlockIds, setTempSelectedBlockIds] = useState<string[]>([]);
    console.log("selectedBlockIds", selectedBlockIds)
    const [blockConfiguration, setBlockConfiguration] = useState<any>({});
    const [bucketConfiguration, setBucketConfiguration] = useState<any>({});
    const [basketConfiguration, setBasketConfiguration] = useState<any>({});
    const [blockAction, setBlockAction] = useState<manageBlockAction>("activeStatusChange");

    const [confirmPopupMessage, setConfirmPopupMessage] = useState<string>("");
    const [openConfirmPopup, setOpenConfirmPopup] = useState<boolean>(false);

    const [popupAction, setPopupAction] = useState<popupType>("Alert");
    const [openGenericModal, setOpenGenericModal] = useState<boolean>(false);
    const [genericModalMessage, setGenericModalMessage] = useState<string>("");

    const [currentBlockData, setCurrentBlockData] = useState<any>({});
    const [saveSequenceLoader, setSaveSequenceLoader] = useState<boolean>(false);
    const clientConfigRef = useRef<any[]>([]);
    const allBanners = useRef<any[] | null>(null);
    const navigate = useNavigate();
    const savedRole: any = useSelector(() => store.getState().roleState.role)
    console.log("savedRole", savedRole)
    const [roleOptions, setRoleOptions] = useState<OptionType[]>([]);
    const [playgroundConfiguration, setPlayGroundConfiguration] = useState<
    any[]
  >([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [keyValue,setKeyValue] = useState<number>(0)
//   const onTriggerConfigChanges = async () => {
//     return doFinalConfigSubmit("playground_config", playgroundConfiguration);
//   };

    async function deleteInnerComponent(targetBlock: any, action: manageBlockAction) {
        switch (targetBlock.type) {
            case "Basket": {
                const newBasketConfiguration = [...basketConfiguration];
                const baskets = newBasketConfiguration[0].value;
                const currentBasket = baskets.find((basket: any) => basket.id === targetBlock.basketId);
                if (currentBasket) {
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
                    // const response = await updateBasket("order_basket_configuration", requestBody);
                    // if (response.status === 200 || response.status === 201) {
                    //     return true;
                    // } else {
                    //     setGenericModalMessage(`Bucket linked with block does not exist now`);
                    //     setPopupAction("Success");
                    //     setOpenGenericModal(true);
                    //     return false;
                    // }
                }
                break;
            }
            case "Bucket": {
                const newBucketConfiguration = [...bucketConfiguration];
                const buckets = newBucketConfiguration[0].value;
                const currentBucket = buckets.find((bucket: any) => bucket.id === targetBlock.bucketId);
                if (currentBucket) {
                    const changedBuckets = buckets.filter((bucket: any) => {
                        return bucket.id !== targetBlock.bucketId
                    })
                    newBucketConfiguration[0].value = changedBuckets;
                    const requestBody = {
                        domainName: "clientconfig",
                        domainType: "bucket_configuration",
                        domainValues: newBucketConfiguration,
                        lob: JSON.parse(localStorage.authContext).user.lob,
                    }
                    // const response = await updateBucketConfig(requestBody, "bucket_configuration");
                    // if (response.status === 200 || response.status === 201) {
                    //     return true;
                    // } else {
                    //     setGenericModalMessage(`Something went wrong while deleting bucket data`);
                    //     setPopupAction("Success");
                    //     setOpenGenericModal(true);
                    //     return false;
                    // }

                } else {
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
    async function updateBlock(allBlocks: any[], targetBlock: any, action: manageBlockAction) {
        try {
            const newBlockConfiguration = [...blockConfiguration];
            const newAllBlocks = action === 'activeStatusChange' ? (allBlocks.map((block: any) => {
                if (block.id === targetBlock.id) {
                    return { ...targetBlock, statusEnabled: !targetBlock.statusEnabled };
                } else {
                    return block;
                }
            })) : (allBlocks.filter((block: any) => {
                return block.id !== targetBlock.id;
            }));
            const homeScreenIndex = newBlockConfiguration.findIndex((configObj) => configObj.name === "homeScreenBlockWidget");
            if (homeScreenIndex !== -1) {
                newBlockConfiguration[homeScreenIndex].value = newAllBlocks;
            } else {
                newBlockConfiguration.push({
                    ...defaultBlockConfig,
                    value: newAllBlocks
                })
            }
            // 
            const blockDataPayload: updateConfigRequestBody = {
                domainName: "clientconfig",
                domainType: `${savedRole?.id}_app_layout_configuration`,
                domainValues: newBlockConfiguration,
                lob: getLob()
            };
            const finalMetaDataPayload: metaDataBatchPayload = { features: [blockDataPayload] };
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
                    // const validationObj = validateMetaDataResponse(response?.data?.features);
                    // if (validationObj.success) {
                    if (action === "activeStatusChange") {
                        setGenericModalMessage(
                            translate(
                                TranslationEnum.manage_home_screen,
                                `Block with id: {blockID} ${targetBlock.statusEnabled ? "deactivated" : "activated"} successfully`,
                                { "blockID": targetBlock.id }
                            )
                        );
                    } else {
                        setGenericModalMessage(
                            translate(
                                TranslationEnum.manage_home_screen,
                                `Block with id: {blockID} deleted successfully`,
                                { "blockID": targetBlock.id }
                            )
                        );
                    }
                    setPopupAction("Success");
                    getAndSetBlocks();
                    // } else {
                    //     setPopupAction("Error");
                    //     setGenericModalMessage(validationObj.message)
                    // }
                    setOpenGenericModal(true);
                } else {
                    setPopupAction("Error");
                    setGenericModalMessage("Something went wrong!");
                    setOpenGenericModal(true);
                }
            } catch (err) {
                console.log(err);
                setPopupAction("Error");
                setGenericModalMessage("Something went wrong while updating block data!");
                setOpenGenericModal(true);
            }

            // Old OTP + metadata batch flow (kept for reference)
            // validateWithOtp((verfiedUser?: manageUpdateAccessObj,verifyResponse?: any) => {
            //   if (verifyResponse.status >= 200 && verifyResponse.status < 300) {
            //     const validationObj = validateMetaDataResponse(verifyResponse?.data?.features);
            //     if(validationObj.success){
            //       if(action === "activeStatusChange"){
            //         setGenericModalMessage(translate(TranslationEnum.manage_home_screen, `Block with id: {blockID} ${targetBlock.statusEnabled? "deactivated" : "activated"} successfully`,{"blockID":targetBlock.id}))
            //       }else{
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
        } catch (err) {
            console.log(err);
            setPopupAction("Error");
            setGenericModalMessage("Something went wrong!")
            setOpenGenericModal(true);
        }
    }
    async function blockStatusChange( targetBlock: any) {
        if (targetBlock.statusEnabled) {
            const updatedEnabledBlocks = enabledBlocks.filter((block) => block.id !== targetBlock.id);
            const updatedDisabledBlock = { ...targetBlock, statusEnabled: false };
            const updatedDisabledBlocks = [...disabledBlocks, updatedDisabledBlock];
        
            setEnabledBlocks(updatedEnabledBlocks);
            setDisabledBlocks(updatedDisabledBlocks);
          } else {
            const updatedDisabledBlocks = disabledBlocks.filter((block) => block.id !== targetBlock.id);
            const updatedEnabledBlock = { ...targetBlock, statusEnabled: true };
            const updatedEnabledBlocks = [...enabledBlocks, updatedEnabledBlock];
        
            setEnabledBlocks(updatedEnabledBlocks);
            setDisabledBlocks(updatedDisabledBlocks);
          }
    }
    async function getAndSetBlocks() {
        setShowLoader(true);
        const clientConfig = await fetchClientConfig();
        clientConfigRef.current = clientConfig;
        let betaConfig = clientConfig.find((config: any) => {
            return config.domainType === "beta_configuration";
        })?.domainValues;
        const betaBlocks = betaConfig?.find((configObj: retailerAppLayoutConfigObj) => {
            return configObj.name === "homeScreenBlockWidget";
        })?.value ?? [];
        let useBeta = false;
        if (Array.isArray(betaBlocks) && betaBlocks.length > 0) {
            setUseBeta(true);
             
            useBeta = true;//
        }
        const blockConfig = clientConfig.find((Obj: { domainType: string }) => {
            return Obj.domainType === `${savedRole?.id}_app_layout_configuration`
        })?.domainValues ?? defaultBlockConfig;
        const allBlocks = useBeta ? betaBlocks : blockConfig.find((configObj: retailerAppLayoutConfigObj) => {
            return configObj.name === "homeScreenBlockWidget";
        })?.value ?? [];
        // 
        setTestBlocks(allBlocks)
        const enabledBlocks = allBlocks.filter((block: any) => block.statusEnabled);
        const disabledBlocks = allBlocks.filter((block: any) => !block.statusEnabled);
        // 
        setDisabledBlocks(disabledBlocks)
        setEnabledBlocks(enabledBlocks)
        setBlocks(allBlocks);
        setBlockConfiguration(useBeta ? (betaConfig ?? []) : blockConfig);
        const bucketConfig = clientConfig.find((Obj: { domainType: string }) => {
            return Obj.domainType === 'bucket_configuration'
        })?.domainValues;
        setBucketConfiguration(bucketConfig);

        const basketConfig = clientConfig.find((Obj: { domainType: string }) => {
            return Obj.domainType === 'order_basket_configuration'
        })?.domainValues;
        let banners;
    //   const clientConfig = await getNewMetaDataConfig();
    //   clientConfigRef.current = clientConfig ?? [];
      let portal_config = clientConfig.find((config: any) => {
        return config.domainType === "portal_configuration";
      })?.domainValues;
      const useSalesHubAPI = portal_config?.find(
        (item) => item.name === "useSaleshub"
      )?.value ?? false;
    //   const showNewBanner = await getAndSetBlocks();
    //   const reduxBannerState = store.getState().bannerState;
    //   let banners;
      if (useSalesHubAPI) {
        // Fetch from Saleshub API
        try {
          const resp = await fetch('https://api.salescodeai.com/banners', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'authorization': localStorage.getItem("auth_token") || defaultTokenNew,
            },
          });
          if (resp.ok) {
            const saleshubData = await resp.json();
            // If API returns array, transform each
            banners = transformFromSaleshubPayload(saleshubData);
            console.log("banners",banners);
            // setIsLoadingSaleshub(false);
          } else {
            banners = [];
          }
        } catch (e) {
          banners = [];
        }
      } else {
        banners = await getAllBanners();
      }
        allBanners.current = banners;
        setBasketConfiguration(basketConfig);

        setShowLoader(false);
    }
    async function addBlock() {
        try {
            // 
            setSaveSequenceLoader(true);
            const newBlockConfiguration = [...blockConfiguration];
            console.log("selectedBlockIds",selectedBlockIds)
            const newlyEnabledBlocks: typeof blocks = [];
            const testblock= cloneDeep(blocks)
            testblock.forEach((block:any) => {
                if (selectedBlockIds.includes(block.id) && !block.statusEnabled) {
                    block.statusEnabled = true;
                    newlyEnabledBlocks.push(block);
                }
            });
            const remainingBlocks = testblock.filter(
                (block:any) => !newlyEnabledBlocks.includes(block)
            );
            const newAllBlocks = [...remainingBlocks, ...newlyEnabledBlocks];          
            const homeScreenIndex = newBlockConfiguration.findIndex((configObj) => configObj.name === "homeScreenBlockWidget");
            if (homeScreenIndex !== -1) {
                newBlockConfiguration[homeScreenIndex].value = newAllBlocks;
            } else {
                newBlockConfiguration.push({
                    ...defaultBlockConfig,
                    value: newAllBlocks
                })
            }
            // 
            const blockDataPayload: updateConfigRequestBody = {
                domainName: "clientconfig",
                domainType: `${savedRole?.id}_app_layout_configuration`,
                domainValues: newBlockConfiguration,
                lob: getLob(),
            };
            setSaveSequenceLoader(false);
            const finalMetaDataPayload: metaDataBatchPayload = { features: [blockDataPayload] };
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
                    // const validationObj = validateMetaDataResponse(response?.data?.features);
                    // if (validationObj.success) {
                    setGenericModalMessage(`Sequence saved successfully`);
                    setPopupAction("Success");
                    getAndSetBlocks();
                    // } else {
                    //     setPopupAction("Error");
                    //     setGenericModalMessage(validationObj.message)
                    // }
                    setOpenGenericModal(true);
                } else {
                    setPopupAction("Error");
                    setGenericModalMessage("Something went wrong while saving sequence!");
                    setOpenGenericModal(true);
                }
            } catch (err) {
                console.log(err);
                setPopupAction("Error");
                setGenericModalMessage("Something went wrong while saving sequence!");
                setOpenGenericModal(true);
            }

            // Old OTP + metadata batch flow (kept for reference)
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
        } catch (err) {
            console.log(err);
            setSaveSequenceLoader(false);
            setPopupAction("Error");
            setGenericModalMessage("Something went wrong while saving sequence!")
            setOpenGenericModal(true);
        }
    }
    async function saveSequence() {
        try {
            
            // await doFinalConfigSubmit("playground_config", []);
            setSaveSequenceLoader(true);
            const newBlockConfiguration = [...blockConfiguration];
            const newAllBlocks = [...enabledBlocks,...disabledBlocks];
            const homeScreenIndex = newBlockConfiguration.findIndex((configObj) => configObj.name === "homeScreenBlockWidget");
            if (homeScreenIndex !== -1) {
                newBlockConfiguration[homeScreenIndex].value = newAllBlocks;
            } else {
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
            };
            const betaBlockDataPayload: updateConfigRequestBody = {
                domainName: "clientconfig",
                domainType: "beta_configuration",
                domainValues: newBlockConfiguration,
                lob: getLob(),
            };
            let finalPaylod = useBeta ? betaBlockDataPayload : blockDataPayload;
            setSaveSequenceLoader(false);
            const finalMetaDataPayload: metaDataBatchPayload = { features: [finalPaylod] };
            
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
                    // const validationObj = validateMetaDataResponse(response?.data?.features);
                    // if (validationObj.success) {
                    setGenericModalMessage(`Sequence saved successfully`);
                    setPopupAction("Success");
                    getAndSetBlocks();
                    // } else {
                    //     setPopupAction("Error");
                    //     setGenericModalMessage(validationObj.message)
                    // }
                    setOpenGenericModal(true);
                } else {
                    setPopupAction("Error");
                    setGenericModalMessage("Something went wrong while saving sequence!");
                    setOpenGenericModal(true);
                }
            } catch (err) {
                console.log(err);
                setSaveSequenceLoader(false);
                setPopupAction("Error");
                setGenericModalMessage("Something went wrong while saving sequence!");
                setOpenGenericModal(true);
            }

            // Old OTP + metadata batch flow (kept for reference)
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
        } catch (err) {
            console.log(err);
            setSaveSequenceLoader(false);
            setPopupAction("Error");
            setGenericModalMessage("Something went wrong while saving sequence!")
            setOpenGenericModal(true);
        }

    }
    useEffect(() => {
        getAndSetBlocks();
    }, [savedRole])
    // async function setConfig() {
    //     
    //     const enabledBlocks = testBlocks.filter((block: any) => block.statusEnabled);
    //     const disabledBlocks = testBlocks.filter((block: any) => !block.statusEnabled);
    //     setDisabledBlocks(disabledBlocks)
    //     setEnabledBlocks(enabledBlocks)
    // }
    async function addConfig() {
        
        setTempSelectedBlockIds([])
        const newlyEnabledBlocks: typeof testBlocks = [];
        const testblock= cloneDeep(testBlocks)
            testblock.forEach((block:any) => {
                if (selectedBlockIds.includes(block.id) && !block.statusEnabled) {
                    block.statusEnabled = true;
                    newlyEnabledBlocks.push(block);
                }
            });
            const remainingBlocks = testblock.filter(
                (block:any) => !newlyEnabledBlocks.includes(block)
            );
            const updatedDisabledBlocks = disabledBlocks.filter(
                (block: any) => !newlyEnabledBlocks.some((enabledBlock) => enabledBlock.id === block.id)
              );
              if(newlyEnabledBlocks){
                const updatedEnabledBlocks = [...enabledBlocks, ...newlyEnabledBlocks];
                if (
                    updatedEnabledBlocks.length !== enabledBlocks.length ||
                    !updatedEnabledBlocks.every((block, index) => block.id === enabledBlocks[index]?.id)
                  ){
                    setEnabledBlocks(updatedEnabledBlocks);
                }
              }
              if(updatedDisabledBlocks){
                if (
                    updatedDisabledBlocks.length !== disabledBlocks.length ||
                    !updatedDisabledBlocks.every((block, index) => block.id === disabledBlocks[index]?.id)
                  ){
                    setDisabledBlocks(updatedDisabledBlocks);
                }
              }
            const newAllBlocks = [...enabledBlocks, ...disabledBlocks];       
    }
    // useEffect(() => {
    //     setConfig()
    // }, [testBlocks])
    useEffect(() => {
        addConfig()
    }, [selectedBlockIds])
    useEffect(() => {
        
        console.log("enabledBlocks",enabledBlocks,"disabledBlocks",disabledBlocks)
        setTestBlocks([...enabledBlocks,...disabledBlocks])
        if (Array.isArray(blockConfiguration) && blockConfiguration.length > 0) {
            const newBlockConfiguration = [...blockConfiguration];
            const newAllBlocks = [...enabledBlocks, ...disabledBlocks];
            const homeScreenIndex = newBlockConfiguration.findIndex((configObj) => configObj.name === "homeScreenBlockWidget");
            if (homeScreenIndex !== -1) {
                newBlockConfiguration[homeScreenIndex].value = newAllBlocks;
            } else {
                newBlockConfiguration.push({
                    ...defaultBlockConfig,
                    value: newAllBlocks
                })
            }
            const playgroundConfig = newBlockConfiguration.map((config) => ({
                ...config,
                domainType:`${savedRole?.id}_app_layout_configuration`,
            }));
            setPlayGroundConfiguration(playgroundConfig)
            console.log("playgroundConfig",playgroundConfig)
        }   
    }, [enabledBlocks])

    return (
        <div className='manage-home-screen-parent'>
            {!showLoader ?
                <div className='manage-home-screen-table-preview-container' style={{backgroundColor:"white"}}>
                    <div className='manage-home-screen-table'>
                        <div className="manage-home-screen-header">
                            <div className="manage-home-screen-label">
                                <span>{translate(TranslationEnum.manage_home_screen, "Manage Homescreen")}</span>
                            </div>
                        </div>
                        <div className="manage-home-screen-header">
                            <Autocomplete
                                sx={{
                                    width: "85%",
                                    "& .MuiAutocomplete-inputRoot": {
                                        padding: "4px",
                                    },
                                }}
                                multiple
                                disableCloseOnSelect
                                options={disabledBlocks}
                                getOptionLabel={(block) => block.name}
                                renderOption={(props, block, { selected }) => (
                                    <li {...props}>
                                        <Checkbox
                                            style={{ marginRight: 8 }}
                                            checked={tempSelectedBlockIds.includes(block.id)}
                                        />
                                        {block.name}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        sx={{
                                            "& .MuiInputLabel-root": {
                                                color: "#1c7ea0",
                                              },
                                            "& .MuiFormLabel-root": {
                                                marginTop: "-4px",
                                                "&.MuiInputLabel-shrink": {
                                                    marginTop: "0",
                                                },
                                            },
                                        }}
                                        {...params}
                                        label="Select Blocks"
                                    />
                                )}
                                value={disabledBlocks.filter((block) => tempSelectedBlockIds.includes(block.id))}
                                onChange={(_, newValues) => setTempSelectedBlockIds(newValues.map((block) => block.id))}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                noOptionsText="No disabled blocks"
                            />
                            {/* <Autocomplete
                                sx={{
                                    width: "80%",
                                    "& .MuiAutocomplete-inputRoot": {
                                        padding: "4px",
                                    },
                                }}
                                disableCloseOnSelect
                                options={disabledBlocks as any[]}
                                getOptionLabel={(block: any) => block.name}
                                renderOption={(props: any, block: any, { selected }: any) => (
                                    <li {...props}>
                                        <Checkbox
                                            style={{ marginRight: 8 }}
                                            checked={block.id === selectedBlockId}
                                        />
                                        {block.name}
                                    </li>
                                )}
                                renderInput={(params: any) => (
                                    <TextField
                                        sx={{
                                            "& .MuiFormLabel-root": {
                                                marginTop: "-4px",
                                                "&.MuiInputLabel-shrink": {
                                                    marginTop: "0",
                                                },
                                            }
                                        }}
                                        {...params}
                                        label="Select block to enable"
                                    />
                                )}
                                value={(disabledBlocks as any[]).find((block: any) => block.id === selectedBlockId) || null}
                                onChange={(_: any, newValue: any) => setSelectedBlockId(newValue?.id || null)}
                                isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
                                noOptionsText="No disabled blocks"
                            /> */}
                            <div className="manage-home-screen-buttons">
                                 <button
                                 style={{whiteSpace:"nowrap"}}
                                    className="manage-home-screen-create-new"
                                    onClick={() => {
                                        // addBlock()
                                        setSelectedBlockIds(tempSelectedBlockIds)
                                    }}
                                >
                                    {translate(TranslationEnum.manage_home_screen, "Add Block")}
                                </button>
                                {!props.hideBackButton && <div><BackButton /></div>}
                            </div>
                        </div>
                        <div style={{height:"68%",overflow:"auto",margin:"10px",marginBottom:"0px", border: '1px solid #e0e0e0',borderTopRightRadius: '5px',borderTopLeftRadius:'5px'}}>
                        <HomeScreenDragDropTable data={enabledBlocks} setData={setEnabledBlocks} setConfirmPopupMessage={setConfirmPopupMessage} setOpenConfirmPopup={setOpenConfirmPopup} setCurrentBlockData={setCurrentBlockData} setBlockAction={setBlockAction} blockConfiguration={blockConfiguration} basketConfiguration={basketConfiguration} bucketConfiguration={bucketConfiguration} setShowLoader={setShowLoader}
                            setPopupAction={setPopupAction}
                            setGenericModalMessage={setGenericModalMessage}
                            setOpenGenericModal={setOpenGenericModal} />
                        </div>
                        {(enabledBlocks.length !== 0 || disabledBlocks.length !== 0) &&
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "15px",alignItems:"center",border: '1px solid #e0e0e0',borderTop:'0px',
                            borderBottomLeftRadius: '5px',
                            borderBottomRightRadius:'5px',
                            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',marginInline:"10px"}}>
                                <div style={{display:"flex",gap:"10px"}}>
                                <svg stroke="currentColor" fill="#d98b19" stroke-width="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"></path></svg>
                                    <p style={{fontSize:"14px",margin:"0",color:"#d98b19",fontWeight:500}}>Drag & Drop to adjust the sequence of widget on homescreen</p>
                                </div>
                                <div style={{display:"flex"}}>
                                {/* <Button
                                    variant="contained"
                                    onClick={async () => {
                                        try {
                                            setIsSpinning(true);
                                            // const res: any = await onTriggerConfigChanges();
                                            // console.log("res is " + res);
                                            // if (res["status"] === 200 || res["status"] === 200) {
                                            //     setKeyValue(keyValue + 1);
                                            // }
                                        } catch (error) {
                                            console.error("Error in onTriggerConfigChanges:", error);
                                        }
                                        setTimeout(() => {
                                            setIsSpinning(false);
                                        }, 1000);
                                    }}
                                    sx={{
                                        alignSelf: "flex-end",
                                        backgroundColor: "#00C6B1",
                                        marginRight: "10px",
                                    }}
                                >
                                    PREVIEW
                                    <ReloadButton
                                        isSpinning={isSpinning}
                                        setIsSpinning={setIsSpinning}
                                        handleClick={async () => {
                                            try {
                                                setIsSpinning(true);

                                                const res: any = await onTriggerConfigChanges(); 
                                                console.log("res is " + res);
                                                if (res["status"] === 200 || res["status"] === 200) {
                                                    setKeyValue(keyValue + 1);
                                                }
                                            } catch (error) {
                                                console.error("Error in onTriggerConfigChanges:", error);
                                            }
                                            setTimeout(() => {
                                                setIsSpinning(false);
                                            }, 1000);
                                        }}
                                    />
                                </Button> */}
                                <button className="manage-home-screen-back" disabled={saveSequenceLoader} onClick={() => saveSequence()} style={{display:"flex",gap:"12px",alignItems:"center",padding:"10px"}}>
                                    {saveSequenceLoader ? <div className="manage-home-screen-save-button-progress"><CircularProgress size={15} color="inherit" />{translate(TranslationEnum.manage_home_screen, "SAVE")}</div> : <>{translate(TranslationEnum.manage_home_screen, "SAVE")}</>}
                                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1.2em" width="1.2em" xmlns="http://www.w3.org/2000/svg"><path d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l370.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128z"></path></svg>
                                </button>
                                </div>
                            </div>
                        }
                    </div>  
                    {/* <div className={`previewPage`} style={{marginTop:"15px"}}>
                        <PhoneFrameComponent keyValue={keyValue} setKeyValue={setKeyValue} playgroundConfiguration={playgroundConfiguration} setPlayGroundConfiguration={setPlayGroundConfiguration} onTriggerConfigChanges={onTriggerConfigChanges}   {...(isAdmin || isReportAdmin ? { allowTriggerChanges: true } : {})} widthValue="85%" heightValue="97%" />
                    </div> */}
                </div>
                : <Loader />}
             <ConfirmationPopUp
                openConfirmModal={openConfirmPopup}
                message={confirmPopupMessage}
                setOpenConfirmModal={() => {
                    setOpenConfirmPopup(false);
                }}
                successMethod={() => {
                    blockStatusChange(currentBlockData);
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

export default HomeScreenManagement;