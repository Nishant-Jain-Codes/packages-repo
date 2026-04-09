import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, CircularProgress, InputAdornment, TextField } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader } from '@/components/loader/Loader';
import { GenericPopUp } from '@/components/popup/genericPopUp';
import { fetchClientConfig, getClientConfigDomainType, getWholeSellerConfiguration,  updateWholeSellerConfiguration } from '../../services/manageHomeScreenService';
import { getMetaDataConfig, getNewMetaDataConfig, validateMetaDataResponse } from '@/utils/UtilityService';
import { openPopup } from '@/utils/UtilityService';
import { configurationAttributeType } from '@/types';
import { metaDataBatchPayload, popupType } from '@/types';
import LinkExisting from './LinkExisting';
import { viewType } from '@/features/content-management/bucket/create/CreateBucketTypes';
import { blockInnerComponent, blockNavigateState, blockStateType } from '@/utils/UtilityService';
import { defaultBlockConfig } from '@/utils/UtilityService';
import { BlockTypesOther, blockGeneralTypes, defaultSelectedBlockType, filterBlockTypes } from './BlockType';
import './CreateBlock.css';
import { CreateBlockSubmitProps, retailerAppLayoutConfigObj } from './CreateBlockTypes';
import { validateWithOtp } from '@/utils/validateOtpPopupActions';
import { TranslationEnum, usePortalTranslation } from '@/utils/TranslationProvider';
import { manageUpdateAccessObj } from '@/utils/UtilityService';
import { META_DATA_BATCH_API } from '@/utils/networkServiceSimple';
import { ConfirmationPopUp } from '@/components/confirmationPopUp';
// import PromoBlock from './PromoBlock';
import { getLob } from '@/utils/UtilityService';
import axios from "axios";
import cloneDeep from 'lodash.clonedeep';
import { useSelector } from 'react-redux';
import { store } from '@/utils/UtilityService';
import { use } from 'i18next';





function CreateBlockSubmitButton(props: CreateBlockSubmitProps){
  const { translate } = usePortalTranslation();
  const CUR_COMPONENT_COMMON="commonPortal";
  const [showSubmitLoader,setShowSubmitLoader] = useState<boolean>(false);
  const [openConfirmationModal,setOpenConfirmModal] = useState<boolean>(false);
  async function handleSubmit(){
    
      setShowSubmitLoader(true);
      let message = "";
      if(props.validateAllParentInputs) message = props.validateAllParentInputs();
      if(message!==""){
        openPopup("Alert",message);
        setShowSubmitLoader(false);
        return;
      }
      if(props.handleParentDataSubmit) await props.handleParentDataSubmit();
      setShowSubmitLoader(false);
  }
  return <div className='create-block-submit-button-container'>
    <button className='create-block-submit-button'  onClick={() => {props.redirectToRef.current="";setOpenConfirmModal(true)}} disabled={showSubmitLoader}>
    {showSubmitLoader? (
              <div>
                <CircularProgress size={15} color="inherit" />
                <span className="circular-progress-container">{translate(TranslationEnum.common_portal,"SUBMIT")}</span>
              </div>
            ) : (
              <>{translate(TranslationEnum.common_portal,"SUBMIT")}</>
            )}
    </button>
    <ConfirmationPopUp message="Are you sure you want to save?"
                    openConfirmModal={openConfirmationModal}
                    setOpenConfirmModal={setOpenConfirmModal}
                    successMethod={handleSubmit}/>
  </div>
}
function CreateBlock() {
  const [useBeta, setUseBeta] = useState<boolean>(false);
  const [allowedBlockTypes, setAllowedBlockTypes] = useState<string[]>([]);
  const [bannerBehaviourOptionValue, setBannerBehaviourOptionValue] = useState<any>( { label: "", id: "" });
  const { translate } = usePortalTranslation();
  const CUR_COMPONENT_COMMON="commonPortal";
  const CUR_COMPONENT = "Manage Home Screen"
  const navigate = useNavigate();
  const [view,setView] = useState<viewType>("create");
  const location  = useLocation();
  const locationState: blockNavigateState = location.state as blockNavigateState;
  const blockConfigurationRef = useRef<retailerAppLayoutConfigObj[]>([]);
  const betaConfigurationRef = useRef<retailerAppLayoutConfigObj[]>([]);
  const [blockState,setBlockState] = useState<blockStateType>({
    id: "",
    type: "",
    name: ""
  });
  const [otherBlock,setOtherBlock] =  useState({
    id: "",
    label: "",
  })
  const [blockStateFlag,setBlockStateFlag] = useState({
    id: false,
    type: false,
    name: false
  })
  const [popupType, setPopupType] = useState<popupType>("Alert");
  const [openGenericModal, setOpenGenericModal] = useState<boolean>(false);
  const [popupMessage, setPopupMessage] = useState<string>("");
  const currentBlock = useRef<any | null>(null);
  const blockConfigExists = useRef<boolean>(true);
  const [pageLoader,setPageLoader] = useState<boolean>(false);
  const [filterType,setFilterType] = useState<string>("");
  const allBlocksRef = useRef<any[]>([]);
  const clientConfigRef = useRef<any[]>([]);
  const[blockData,setBlockData] = useState<any>()
  const redirectToRef = useRef<string>("");
  const [isChange,setIsChange] = useState<boolean>(false);
  const [OtherblockTypes,setOtherBlockTypes] = useState<any[]>();
  const [blockTypes,setBlockTypes] = useState<any[]>(blockGeneralTypes);
  const [otherBlockPresent,setOtherBlockPresent] = useState<boolean>(false);
  const savedRole:any = useSelector(() => store.getState().roleState.role)
  console.log("createblockrole",savedRole)
  const [saleshubPostAPI, setSaleshubPostAPI] = useState<boolean>(false);
  const [useSaleshub, setUseSaleshub] = useState<boolean>(false);
  const [extraBlockTypes, setExtraBlockTypes] = useState([
    {
      id: "liveDashboard",
      label: "Live Dashboard"
    },
    // {
    //   id: "kpireview",
    //   label: "KPI Review"
    // },
    // {
    //   id: "newoutlet",
    //   label: "New Outlet in Today's Route"
    // },
    // {
    //   id: "quicktips",
    //   label: "Quick tips for Today"
    // },
    // {
    //   id: "todaysummary",
    //   label: "Today's Summary"
    // },
    // {
    //   id: "newproducts",
    //   label: "New products and focus products"
    // },
    // {
    //   id: "topschemes",
    //   label: "Top Schemes and promotions"
    // }
    {
      id: "dataSyncTextScroll",
      label: "Data Sync Scroll"
    },
    {
      id: "disclaimer",
      label: "Disclaimer"
    },
    {
      id: "orderblockdisclaimer",
      label: "Order Block Disclaimer"
    },
    {
      id: "mustDoAction",
      label: "Must Do Action"
    },
    {
      id: "outletsmaphome",
      label: "Outlets Map"
    },
    {
      id: "locatemyoutlet",
      label: "New Outlet in Today's Route"
    },
    {
      id: "kpi",
      label: "KPI Review"
    },
    {
      id:"live",
      label:"Live"
    }
  ]); 
    const [wholeSellerConfig, setWholeSellerConfig] = useState<boolean>(false);
      useEffect(() => {
      const fetchPortalConfig = async () => {
        const clientConfig = await getNewMetaDataConfig();
        const portalConfig = clientConfig?.find((config: any) => config.domainType === "portal_configuration")?.domainValues ?? [];
        const wholeSellerConfig = portalConfig?.find(
          (item) => item.name === "wholeSellerConfig"
        )?.value ?? false; 
        setWholeSellerConfig(wholeSellerConfig); 
        const configAllowedBlocks =
          portalConfig?.find((item) => item.name === "allowedMultiBlockTypes")
            ?.value ?? [];
        setAllowedBlockTypes(configAllowedBlocks); 
        const saleshubPostAPI = portalConfig?.find(
        (item) => item.name === "saleshubPostAPI"
      )?.value ?? false;
      setSaleshubPostAPI(saleshubPostAPI);
      const useSalesHub = portalConfig?.find(
        (item) => item.name === "useSaleshub"
      )?.value ?? false;
      setUseSaleshub(useSalesHub);
      };
      fetchPortalConfig();
    }, []);

  useEffect(() => {
    async function getAndSetBlockConfiguration(){
      
      const clientconfig = await fetchClientConfig();
      clientConfigRef.current = clientconfig;
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
      let blockConfig = clientconfig.find((config: any) => {
        return config.domainType === `${savedRole?.id}_app_layout_configuration`;
      })?.domainValues;
      let otherBlockTypeConfig = clientconfig.find((config: any) => {
        return config.domainType === "block_configuration";
      })?.domainValues;
      if(savedRole){
        const roleId = savedRole.id;
        if (roleId!=="retailer") {
          setBlockTypes(prevBlockTypes => [...prevBlockTypes, ...extraBlockTypes]);
        }
        else {
          setBlockTypes(prevBlockTypes => prevBlockTypes.filter(type => !extraBlockTypes.includes(type)));
        }
      }
      if(otherBlockTypeConfig){
        setOtherBlockPresent(true)
        const otherBlockTypesConfig = otherBlockTypeConfig.find((configObj: retailerAppLayoutConfigObj) => {
          return configObj.name === "otherBlockTypes";
        })?.value ?? [];
        setOtherBlockTypes(otherBlockTypesConfig)
        setBlockTypes(prevBlockTypes => {
          const exists = prevBlockTypes.some(block => block.id === "other");
          if (!exists) {
              return [
                  ...prevBlockTypes,
                  {
                      id: "other",
                      label: "Other Block"
                  }
              ];
          }
          return prevBlockTypes;
      });
      }
      if(!blockConfig){
        blockConfig = defaultBlockConfig;
        blockConfigExists.current = false;
      }
      blockConfigurationRef.current = blockConfig;
      betaConfigurationRef.current = betaConfig ?? [];
      if(locationState.currentBlock){
        
        if(locationState.currentBlock.type==="Banner"){
          if(locationState.currentBlock.bannerType==="template20" || locationState.currentBlock.bannerType==="tvAdds"){
            setBannerBehaviourOptionValue({ label: "Auto Play Video", id: "tvAdds" })
          }else if(locationState.currentBlock.bannerType==="template1234" || locationState.currentBlock.bannerType==="toggleBanner"){
            setBannerBehaviourOptionValue({ label: "Toggle Banner", id: "toggleBanner" })
          }else{
            setBannerBehaviourOptionValue({ label: "Banner", id: "banner" })
          }
        }
        const allBlocks = useBeta ? betaBlocks : blockConfig.find((configObj: retailerAppLayoutConfigObj) => {
          return configObj.name === "homeScreenBlockWidget";
        })?.value ?? [];
        allBlocksRef.current = allBlocks;
        const curBlock = allBlocks.find((block:any) => {
          return block.id === locationState.currentBlock.id;
        })
        if(curBlock){
          
          currentBlock.current = curBlock;
          setView("edit");
          if(currentBlock.current.id && currentBlock.current.type){
            setBlockState({
              id: currentBlock.current.id,
              type: currentBlock.current.type,
              name: currentBlock.current.name
            })
          }
        }else{
          openPopup("Alert",translate(TranslationEnum.manage_home_screen,`The block with id: {blockID} does not exists now`,{"blockID":locationState.currentBlock.id}),() => {
            window.history.back();
          })
        }
      }
    }
    setPageLoader(true)
    getAndSetBlockConfiguration(); 
    setPageLoader((prevState) => !prevState);
  },[savedRole])

  function validIdValue(id: string){
    return /^[a-zA-Z0-9_]*$/i.test(id)
  }
  function isValidBlockId(){
    const index = locationState.blocks.findIndex(
      (block: any) => block.id === blockState.id
    );
    return index === -1;
  };
  const idValidationText = () => {
    if(!blockState.id){
      return "Please enter a ID";
    }
    if(view==='create' && !isValidBlockId()){
      return `Block with ID: ${blockState.id} already exists`;
    }
    if(!validIdValue(blockState.id)){
      return "ID can only contain alphabets and numbers"
    }
    return "";
  }
  const nameValidationText = () => {
    if(!blockState.name){
      return "Please enter a Block Name";
    }
    if(blockState.name.trim().length===0){
      return "Block Name can't be empty spaces"
    }
    if(blockState.name.length>40){
      return "Block Name should not contain more than 40 characters"
    }
  }
  const idHelperText = idValidationText();
  const nameHelperText = nameValidationText();
  function validateAllBlockInputs(){
    let message = "";
    let invalidCount = 0;
    // if(idHelperText){
    //   message = idHelperText;
    //   invalidCount++;
    // }
    if(invalidCount<2 && nameHelperText){
      message = nameHelperText
      invalidCount++;
    }
    if(invalidCount<2 && !blockState.type){
      message = "Please select a Block type";
      invalidCount++;
    }
    
    if(view==="create" && (!isMultipleBlocksAllowedType && !multipleBlocksAllowed)){
      const homepageConfigIndex = blockConfigurationRef.current.findIndex((configName) => configName.name === "homeScreenBlockWidget");
      const allBlocks = homepageConfigIndex!==-1? blockConfigurationRef.current[homepageConfigIndex].value : [];
      const betaConfigArr = betaConfigurationRef.current ?? [];
      const betaConfigIndex = betaConfigArr.findIndex((configName) => configName.name === "homeScreenBlockWidget");
      const allBetaBlocks = (betaConfigIndex !== -1 ? betaConfigArr[betaConfigIndex]?.value : []) ?? [];
      if(useBeta){
        if(allBetaBlocks.find((block) => {
        return blockState.type === block.type;
      })){
        message = `Block of type ${blockState.type} already exists`;
        invalidCount++;
      }
      }
      if((allBetaBlocks ?? []).find((block) => {
        return blockState.type === block.type;
      })){
        message = `Block of type ${blockState.type} already exists`;
        invalidCount++;
      }
    }
    return invalidCount < 2
      ? message
      : "Multiple Fields are invalid, please fill all the required fields to continue";
  }
  async function doFinalSubmit(innerComponentData?: blockInnerComponent){
    try{
      const newBlockConfiguration = cloneDeep(blockConfigurationRef.current);
      const newBetaConfiguration = (cloneDeep(betaConfigurationRef.current) ?? []);
      const homepageConfigIndex = newBlockConfiguration?.findIndex((configName:any) => configName.name === "homeScreenBlockWidget");
      const allBlocks = homepageConfigIndex!==-1? newBlockConfiguration[homepageConfigIndex].value : [];
      const betaConfigIndex = newBetaConfiguration?.findIndex((configName:any) => configName.name === "homeScreenBlockWidget");
      const allBetaBlocks = (betaConfigIndex !== -1 ? newBetaConfiguration[betaConfigIndex]?.value : []) ?? [];
      let newAllBlocks = [...allBlocks];
      let newAllBetaBlocks = [...(allBetaBlocks ?? [])];
      const trimmedBlockState = {
        ...blockState,
        name: blockState.name.trim()
      }
      const newBlockData = {
        ...trimmedBlockState,
        ...innerComponentData,
        statusEnabled: true
      }
      // 
      if(redirectToRef.current && !isChange){
        if(redirectToRef.current==="banner"){
          navigate("/dashboard/newManageBannerStudio/banner",{
            state: {
                blockData:newBlockData
            }})
        }
        if(redirectToRef.current==="bucket"){
          navigate("/dashboard/manageBucketStudio/createBucket",{
            state: {
                blockData:newBlockData
            }})
        }
        if(redirectToRef.current==="basket"){
          navigate("/dashboard/manageBasketStudio/createBasket",{
            state: {
                blockData:newBlockData
            }})
        }
        return;
      }
      if(!newBlockData.id) newBlockData.id = new Date().getTime().toString();
      setBlockData(newBlockData)
      if (view === "create"){
        newAllBlocks = [...allBlocks, newBlockData];
        newAllBetaBlocks = [...(allBetaBlocks ?? []), newBlockData];
      }
      else if (view === "edit") {
        const blockBetaIdx = (allBetaBlocks ?? []).findIndex(
          (block:any) => block.id === blockState.id
        );
        const blockIdx = allBlocks.findIndex(
          (block:any) => block.id === blockState.id
        );
        newAllBlocks[blockIdx] = newBlockData;
        newAllBetaBlocks[blockBetaIdx] = newBlockData;
      }
      // blockConfiguration[0].value = newAllBlocks;
      if(homepageConfigIndex!==-1){
        newBlockConfiguration[homepageConfigIndex].value = newAllBlocks;
      }else{
        const homePageConfigObj = {...defaultBlockConfig[0]};
        homePageConfigObj.value = newAllBlocks;
        newBlockConfiguration.push(homePageConfigObj);
      }
      if (Array.isArray(newBetaConfiguration)) {
        if (betaConfigIndex !== -1) {
          newBetaConfiguration[betaConfigIndex].value = newAllBetaBlocks;
        } else {
          const homePageBetaConfigObj = { ...defaultBlockConfig[0] };
          homePageBetaConfigObj.value = newAllBetaBlocks;
          newBetaConfiguration.push(homePageBetaConfigObj);
        }
      }
      
      let blockDataPayload = {
        domainName: "clientconfig",
        domainType: `${savedRole?.id}_app_layout_configuration`,
        domainValues: newBlockConfiguration ,
        lob: getLob(),
      };
      let betaPayload = {
        domainName: "clientconfig",
        domainType: "beta_configuration",
        domainValues: newBetaConfiguration,
        lob: getLob(),
      };
      let finalPayload = useBeta ? betaPayload : blockDataPayload;
      
      // console.log("redirectTo",redirectToRef.current)
      const finalMetaDataPayload: metaDataBatchPayload = { features: [finalPayload] };
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
          // const validationObj = validateMetaDataResponse(response?.data?.features);
          // if (validationObj.success) {
          //   if(redirectToRef.current==="banner"){
          //     navigate("/dashboard/newManageBannerStudio/banner",{
          //       state: {
          //           blockData:newBlockData
          //       }})
          //   }
          //   if(redirectToRef.current==="bucket"){
          //     navigate("/dashboard/manageBucketStudio/createBucket",{
          //       state: {
          //           blockData:newBlockData
          //       }})
          //   }
          //   if(redirectToRef.current==="basket"){
          //     navigate("/dashboard/manageBasketStudio/createBasket",{
          //       state: {
          //           blockData:newBlockData
          //       }})
          //   }
          //   setPopupMessage(
          //     `Block with name: ${blockState.name} ${view==="create"?"created": "updated"} successfully`
          //   );
          //   setPopupType("Success");
          // } else {
          //   setPopupMessage(validationObj.message);
          //   setPopupType("Error");
          // }
          setPopupMessage(`Block with name: ${blockState.name} ${view==="create"?"created": "updated"} successfully`);
          setPopupType("Success");
          setOpenGenericModal(true);
        } else {
          setPopupMessage("Something went wrong while submitting block data");
          setPopupType("Error");
          setOpenGenericModal(true);
        }
      } catch (err) {
        console.error("Failed to update block configuration via S3 API:", err);
        setPopupMessage(`Something went wrong while ${view==="create"? "creating": "updating"} block, Please try again`);
        setPopupType("Error");
        setOpenGenericModal(true);
      }

      // Old OTP + metadata batch flow (kept for reference)
      // validateWithOtp((verifiedUser?: manageUpdateAccessObj,verifyResponse?: any) => {
      //   if (verifyResponse.status >= 200 &&  verifyResponse.status <300) {
      //     const validationObj = validateMetaDataResponse(verifyResponse?.data?.features);
      //     if(validationObj.success){
      //       if(redirectToRef.current==="banner"){
      //         navigate("/dashboard/newManageBannerStudio/banner",{
      //           state: {
      //               blockData:newBlockData
      //           }})
      //       }
      //       if(redirectToRef.current==="bucket"){
      //         navigate("/dashboard/manageBucketStudio/createBucket",{
      //           state: {
      //               blockData:newBlockData
      //           }})
      //       }
      //       if(redirectToRef.current==="basket"){
      //         navigate("/dashboard/manageBasketStudio/createBasket",{
      //           state: {
      //               blockData:newBlockData
      //           }})
      //       }
      //       setPopupMessage(
      //         `Block with name: ${blockState.name} ${view==="create"?"created": "updated"} successfully`
      //       );
      //       setPopupType("Success");
      //     }else{
      //       setPopupMessage(
      //        validationObj.message
      //       );
      //       setPopupType("Error");
      //     }
      //   setOpenGenericModal(true);
      //   } else {
      //     setPopupMessage(
      //       "Something went wrong while submitting block data"
      //      );
      //      setPopupType("Error");
      //   }
      // },undefined,"all",META_DATA_BATCH_API,finalMetaDataPayload,"PUT")
    }catch(err){
      setPopupMessage(`Something went wrong while ${view==="create"? "creating": "updating"} block, Please try again`);
      setPopupType("Error");
      setOpenGenericModal(true);
    }
    
    
  }
  async function handleBlockSubmit(innerComponentData?: blockInnerComponent){
      doFinalSubmit(innerComponentData);
  }
  // function renderBlockTypeInputs(){
  //   switch(blockState.type){
  //     case "Banner": return <LinkExisting curBlockData={currentBlock.current} blockState={blockState} handleParentDataSubmit={handleBlockSubmit} validateAllParentInputs={validateAllBlockInputs} view={view} />
  //     case "Basket": return <CreateBasket parentView={view} parentType='block' parentId={blockState.id} validateAllParentInputs={validateAllBlockInputs} handleParentDataSubmit={handleBlockSubmit} />
  //     case "Bucket": return <CreateBucket parentView={view} parentType='block' parentId={blockState.id} validateAllParentInputs={validateAllBlockInputs} handleParentDataSubmit={handleBlockSubmit} />
  //     default: return <></>
  //   }
  // }
  function renderBlockFields(){
    // if(blockState.type==="PromoBlock") return <PromoBlock redirectToRef={redirectToRef} view={view} setIsChange={setIsChange} curBlockData={currentBlock.current} validateAllParentInputs={validateAllBlockInputs} handleParentDataSubmit={handleBlockSubmit}/>
    if(!blockState.type || !isMultipleBlocksAllowedType) return <></>;
    return <LinkExisting redirectToRef={redirectToRef} curBlockData={currentBlock.current} blockState={blockState} handleParentDataSubmit={handleBlockSubmit} validateAllParentInputs={validateAllBlockInputs} view={view} setIsChange={setIsChange} bannerBehaviourOptionValue={bannerBehaviourOptionValue} setBannerBehaviourOptionValue={setBannerBehaviourOptionValue} currentBlock={currentBlock} />
  }
  const isMultipleBlocksAllowedType = useMemo(() => {
    
    return ["Basket","Banner","Bucket"].includes(blockState.type);
  },[blockState.type]);
  const multipleBlocksAllowed = useMemo(() => {
  if (!blockState.type) return ["Basket","Banner","Bucket"].includes(blockState.type);
  return allowedBlockTypes.includes(blockState.type);
}, [blockState.type, allowedBlockTypes]);


  const selectedBlockType = useMemo(() => {
    
    if(!["Basket","Banner","Bucket","liveDashboard","additional","dataSyncTextScroll","live", "disclaimer", "orderblockdisclaimer", "mustDoAction", "outletsmaphome", "locatemyoutlet", "livedashboard", "kpi"].includes(blockState.type)){
    return OtherblockTypes?.find((option) => option.id === blockState.type) ?? defaultSelectedBlockType
    }else{
    return blockTypes.find((option) => option.id === blockState.type) ?? defaultSelectedBlockType
    }
  },[blockState.type])
  console.log("blockTypes",blockTypes,blockState,selectedBlockType)

  useEffect(() => {
    if(!otherBlockPresent){
      if(view==="edit" && !["Basket","Banner","Bucket"].includes(blockState.type)){
        setBlockTypes(prevBlockTypes => {
          const exists = prevBlockTypes.some(block => block.id === "other");
          if (!exists) {
              return [
                  ...prevBlockTypes,
                  {
                      id: "other",
                      label: "Other Block"
                  }
              ];
          }
          return prevBlockTypes;
      });
      }
    }
    if(view==="edit" && !["Basket","Banner","Bucket","liveDashboard","dataSyncTextScroll","live", "disclaimer", "orderblockdisclaimer", "mustDoAction", "outletsmaphome", "locatemyoutlet", "livedashboard", "kpi"].includes(blockState.type)){
      setOtherBlock({
        id: "other",
        label: "Other Block"
    })
    }
  },[view])
  console.log("selectedBlockType",selectedBlockType,blockState,view,currentBlock.current)
  return (
    pageLoader? <Loader /> : <div className='create-block-container'>
      <div className="create-block-parent">
        <div className="create-block-label">
          <span>{view=="create"? translate(TranslationEnum.manage_home_screen,"Create Block") : translate(TranslationEnum.manage_home_screen,"Edit Block")}</span>
          <button
            className="create-block-label-back-button"
            onClick={() => {
              window.history.back();
            }}
          >
            {translate(TranslationEnum.common_portal,"BACK")}
          </button>
        </div>
        <div className="create-block-input-fields">
            {view==="edit" && <><label className="create-block-input-labels">{translate(TranslationEnum.manage_home_screen,"BLOCK ID")}</label>
            <TextField
              size="small"
              disabled={view==="edit"}
              placeholder={"Enter Id"}
              value={blockState.id}
              onChange={(event) => {
                if(!blockStateFlag.id) setBlockStateFlag({...blockStateFlag, id: true});

                setBlockState({...blockState,id: event.target.value});
              }}
              error={blockStateFlag.id && Boolean(idHelperText)}
              helperText = {blockStateFlag.id && idHelperText}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faPen} />
                  </InputAdornment>
                ),
              }}
            /></>}
            <label className="create-block-input-labels">{translate(TranslationEnum.manage_home_screen,"BLOCK NAME")}</label>
            <TextField
              size="small"
              placeholder={"Enter Name"}
              value={blockState.name}
              onChange={(event) => {
                if(!blockStateFlag.name) setBlockStateFlag({...blockStateFlag, name: true});

                setBlockState({...blockState,name: event.target.value});
                setIsChange(true)
              }}
              error={blockStateFlag.name && Boolean(nameHelperText)}
              helperText = {blockStateFlag.name && nameHelperText}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faPen} />
                  </InputAdornment>
                ),
              }}
            />
            <label className="create-block-input-labels">{translate(TranslationEnum.manage_home_screen,"BLOCK TYPE")}</label>
            <Autocomplete
              disableClearable
              sx={{ width: "100%" }}
              disabled={view==="edit"}
              onChange={(event, value: {id: string, label: string}) => {
                setBannerBehaviourOptionValue({ label: "", id: "" })
                if(!blockStateFlag.type) setBlockStateFlag({...blockStateFlag, type: true});
                setFilterType("Link from existing"); // setting "link from existing" flow for all innerComponent block typps
                if(value.id!=="other"){
                  setOtherBlock({
                    id: "",
                    label: ""
                })
                  setBlockState({...blockState,type: value.id});  
                }else{
                  setOtherBlock({
                    id: "other",
                    label: "Other Block"
                })
                  setBlockState({...blockState,type: ""});  
                }
              }}
              value={(otherBlock && otherBlock.id!="")? otherBlock : selectedBlockType}
              options={blockTypes}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={"Select Block Type"}
                />
              )}
            />

            {OtherblockTypes && otherBlock && otherBlock.id!="" && <>
            <label className="create-block-input-labels">OTHER BLOCK TYPE</label>
            <Autocomplete
              disableClearable
              sx={{ width: "100%" }}
              disabled={view==="edit"}
              onChange={(event, value: {id: string, label: string}) => {
                if(!blockStateFlag.type) setBlockStateFlag({...blockStateFlag, type: true});
                setFilterType("Link from existing"); // setting "link from existing" flow for all innerComponent block typps
                setBlockState({...blockState,type: value.id});
              }}
              value={selectedBlockType}
              options={OtherblockTypes}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={"Select Other Block Type"}
                />
              )}
            />
            </>}

          {/* Currently hiding creation type filter */}
          {(false && blockState.type && blockState.type!=="Banner" && (isMultipleBlocksAllowedType) && view !== "edit" ) &&  <div> 
            <label className="create-block-input-labels">CREATION TYPE</label>
            <Autocomplete
              disableClearable
              sx={{ width: "100%" }}
              onChange={(event, value: string) => {
                setFilterType(value)
              }}
              value={filterType}
              options={filterBlockTypes}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={"Select Creation Type"}
                />
              )}
            />
          </div>}
        
           {(!["Basket","Banner","Bucket","PromoBlock"].includes(blockState.type))? <CreateBlockSubmitButton redirectToRef={redirectToRef} validateAllParentInputs={validateAllBlockInputs} handleParentDataSubmit={handleBlockSubmit} /> : <></>}
        </div>
      </div>
      {/* {(view === "edit" || !isMultipleBlocksAllowedType)? renderBlockTypeInputs() : (
        <>
          {filterType === "New" && renderBlockTypeInputs()}
          {filterType === "Link from existing" && blockState.type==="Basket" && <LinkExisting currentBlockData={currentBlock.current} blockState={blockState} handleParentDataSubmit={handleBlockSubmit} validateAllParentInputs={validateAllBlockInputs} view={view} />}
        </>
      )} */}
      {
        renderBlockFields()
      }
      <GenericPopUp
        type={popupType}
        message={popupMessage}
        setOpenGenericModal={popupType==="Success"?() => {
            setOpenGenericModal(false);
            window.history.back();
          }: setOpenGenericModal}
        openGenericModal={openGenericModal}
      />
    </div>
  )
}

export default CreateBlock;