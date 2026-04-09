import { Backdrop, Box, Button, Modal, Paper, TextField, Tooltip, Typography } from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../manageBanner/ManageBanner.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faXmark } from "@fortawesome/free-solid-svg-icons";
import { DataGrid, GridColDef, GridColumnHeaderParams, GridOverlay } from "@mui/x-data-grid";
import {
  changeStatusBannerDistribution,
  deleteBanner,
  getAllBanners,
  getBannerStatus,
  getBannerStatusChangePayload,
  getConfigFromClientConfig,
  getGlobalFilters,
  getLocationParam,
  makeBannerDistributionData,
  validateBannerResponse,
} from "../../services/bannerServices";
import { ConfirmationPopUp } from "@/components/confirmationPopUp";
import { popupType } from "@/types";
import { GenericPopUp } from "@/components/popup/genericPopUp";
import {
  resetBanner,
  setCurrentBanner,
} from "@/features/content-management/state/bannerActions";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Loader } from "@/components/loader/Loader";
  import { bannerData, bannerV2DataPayload, paginationState } from "@/features/content-management/banner/create/bannerTypes";
import { bannerTemplates } from "@/features/content-management/banner/create/bannerTemplates";
import Switch from "react-switch";
import { clearGenericFilter, getCurrentGlobalFilter, getCurrentGlobalFilterObject } from "@/stateManagement/actions/genericFilterActions";
import { validateWithOtp } from "@/utils/validateOtpPopupActions";
import moment from 'moment';
import { bannerMockData, getMetaDataConfig, openPopup, transformFromSaleshubPayload, transformToSaleshubPayload } from "@/utils/UtilityService";
// import { downloadSupportReport, getReportStatus, uploadReport } from "@/services/supportService";
// import DownloadLoader from "@/components/popup/downloadLoader";
import GenericFilters from "@/components/genericFilters/genericFilters";
import { store } from "@/utils/UtilityService";
import { ChannelkartNetworkGet, defaultTokenNew } from "@/utils/networkServiceSimple";
import cloneDeep from "lodash/cloneDeep";
import { BannerTemplate } from "@/utils/UtilityService";
import { filterType, uploadReportType } from "@/types";
import { manageUpdateAccessObj } from "@/utils/UtilityService";
import { manageBannerSearchParams } from "@/utils/UtilityService";
import { useTranslation } from 'react-i18next';
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";
import { getNewMetaDataConfig, getNewConfiguration } from "@/utils/UtilityService";
import BackButton from "@/utils/BackButton";
import BannerStatusModal from "@/features/content-management/banner/manage/BannerStatusModal";
import { getConfigKeyValue } from "@/features/content-management/services/manageHomeScreenService";
import { useSelector } from "react-redux";
import { retailerAppLayoutConfigObj } from "@/features/content-management/block/create/CreateBlockTypes";
import { set } from "date-fns";

function NewManageBanner(props: { hideBackButton?: boolean }) {
  const [useBeta, setUseBeta] = useState<boolean>(false);
  const [useSaleshub, setUseSaleshub] = useState<boolean>(false); 
  const navigate = useNavigate();
  const [rows, setRows] = useState<bannerData[]>([]);
  const allBannerData = useRef<bannerData[]>([]);
  const allTableBanners = useRef<bannerData[]>([]);

  const [popupState, setPopupState] = useState<boolean>(false);
  const [genericFilter,setGenericFilter] = React.useState<any[]>([]);
  const [popupType, setPopupType] = useState<popupType>("Alert");
  const [popupMessage, setPopupMessage] = useState<string>("");

  const [ConfirmPopupState, setConfirmPopupState] = useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const tgtBanner = useRef<bannerData | null>(null);
  const [opertationType, setOperationType] = useState<"DELETE" | "STATUS">(
    "STATUS"
  );
  const [isLoading,setIsLoading] = useState<boolean>(false);  
  const [isLoadingSaleshub,setIsLoadingSaleshub] = useState<boolean>(false);  
  const [useEffectDependency,setUseEffectDependendency] = useState<boolean>(false);

  const [reportDownloadInProcess,setReportDownloadInProcess] = useState<boolean>(false);
  const [openReportModal,setOpenReportModal] = useState<boolean>(false);
  const popUpSuccessMethod = useRef<any>(() => {});
  const bannerFilterRef = useRef<any>(null);
  const location = useLocation();
  const curPathName = location.pathname;
  const [searchParams,setSearchParams] = useSearchParams();
  const [searchText,setSearchText] = useState<string>("");

  const filtersChanged = searchParams.get("filtersChanged")==='true';
  
  const [bannerActionsLoading,setBannerActionsLoading] = useState<boolean>(false);
  const [resetFiltersFlag,setResetFiltersFlag] = useState<boolean>(false);
  const { translate } = usePortalTranslation();
  const clientConfigRef = useRef<any[]>([]);

  const [modelData, setModelData] = useState<any>();
  const [openModal, toggleModal] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [isModalLoading,setIsModalLoading] = useState<boolean>(true);  
  const savedRole:any = useSelector(() => store.getState().roleState.role)
  async function getAndSetBlocks(){
    const clientConfig = await getNewMetaDataConfig();
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
       
      useBeta = true;
    }
    const roleLayoutConfig = useBeta ? (betaConfig ?? []) : getConfigFromClientConfig(clientConfig,`${savedRole?.id}_app_layout_configuration`);
    const allBlocks = getConfigKeyValue(roleLayoutConfig ?? [],"homeScreenBlockWidget")
    if(allBlocks && Array.isArray(allBlocks)){
        return true
    }else{
        return false
    } 
}

  const getMinutesDifference = (lastModifiedTime: string): { minutesDifference: number; formattedTime: string } => {
    const lastModifiedMomentUTC = moment.utc(lastModifiedTime, "YYYY-MM-DD HH:mm:ss.SSS");
    const currentMomentLocal = moment();
    const timeDifferenceMillis = currentMomentLocal.diff(lastModifiedMomentUTC);
    const timeDifferenceSeconds = Math.floor(timeDifferenceMillis / 1000);
    const timeDifferenceMinutes = Math.floor(timeDifferenceSeconds / 60);
    const formattedLocalTime = lastModifiedMomentUTC.local().format("YYYY-MM-DD HH:mm:ss");
    return {
        minutesDifference: timeDifferenceMinutes,
        formattedTime: formattedLocalTime
    };
};

  async function getBannerStatusConfig(){
    try{
        const filterResp = await getNewMetaDataConfig();
        const bannerConfig= filterResp && filterResp.domainValues?.[0].value;
        const bannerStatusConfig = bannerConfig && bannerConfig.find((item: { name: string; }) => item.name === "bannerStatus");
        if(bannerStatusConfig){
          setShowStatus(bannerStatusConfig.value)
        }
    }catch(err){
        console.log(err);
        openPopup("Alert","Error while fetching banner config");
    }
  } 

  useEffect(() => {
    async function handleGetAllBanners() {
      setIsLoading(true);
      setIsLoadingSaleshub(true);
      const clientConfig = await getNewMetaDataConfig();
      clientConfigRef.current = clientConfig ?? [];
      let portal_config = clientConfig.find((config: any) => {
        return config.domainType === "portal_configuration";
      })?.domainValues;
      const useSalesHubAPI = portal_config?.find(
        (item) => item.name === "useSaleshub"
      )?.value ?? false;
      setUseSaleshub(useSalesHubAPI);
      const showNewBanner = await getAndSetBlocks();
      const reduxBannerState = store.getState().bannerState;
      let banners;
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
            const saleshubData = bannerMockData.length>0 ? bannerMockData : await resp.json();
            // If API returns array, transform each
            banners = transformFromSaleshubPayload(saleshubData);
            console.log("banners",banners);
            setIsLoadingSaleshub(false);

          } else {
            banners = [];
          }
        } catch (e) {
          banners = [];
          setIsLoadingSaleshub(false);

        }
      } else {
        setIsLoadingSaleshub(false);
        banners = await getAllBanners();
      }
      // ...existing code...
      const oldBanners = banners;
      const rowData = oldBanners.map((banner) => {
        return {
          ...banner,
          bannerTemplateType: bannerTemplates.find((bannerTemplate) => banner.bannerType === bannerTemplate.id)?.label
        }
      });
      if (showNewBanner) {
        setRows(rowData);
      }
      allBannerData.current = allTableBanners.current = [...rowData];
      
      if(reduxBannerState){
        if(reduxBannerState?.isUpdated){
          navigate(curPathName, { replace: true }); //to remove queryParams(if any)
        }
        resetBanner();
      }
      if(!reduxBannerState?.isUpdated && filtersChanged){ //take to first page as filters are reseted
        navigate(curPathName, { replace: true });
      } 
      const genericFilterState = store.getState().genericFilter;
      if(genericFilterState){
        clearGenericFilter();
      }
      setIsLoading(false);
    }
    handleGetAllBanners();
  }, [useEffectDependency, useSaleshub]);

  useEffect(()=>{
    clearGenericFilter();
    const getAndSetGlobalFilters = async ()=>{
      const filters = await getGlobalFilters("manageBannerGlobalFilter",clientConfigRef.current);
      if(filters.length){
          setGenericFilter(filters);
      }
    }
    getAndSetGlobalFilters();
    getBannerStatusConfig();
  },[])

  const getFilterString = (filterValues:any)=>{
    let filter:string = "&filter=";
    let andFlag:boolean = false;
    if(filterValues.loginId){
      filter = filter + "supplier.immediateParent:" + filterValues.loginId;
      andFlag = true;
    }
    if(filterValues.branch){
      filter = filter + (andFlag ? " AND " : "") + "locationHierarchy[regex]:" + filterValues.branch;
      andFlag = true;
    }else if (filterValues.district){
      filter = filter + (andFlag ? " AND " : "") +"locationHierarchy[regex]:" + filterValues.district;
      andFlag = true;
    }
    const alreadyAddedFilters = ['loginId','branch','district','banner'];
    Object.keys(filterValues).forEach(filterKey=>{
      if(!alreadyAddedFilters.includes(filterKey)){
        filter = filter + (andFlag ? " AND " : "") + filterKey + ":" + filterValues[filterKey];
        andFlag = true;
      }
    })
    return filter;

  }

  const onApplyClick = async ()=>{
    setIsLoading(true);
    setSearchText("");
    const filterValues = getCurrentGlobalFilterObject();
    bannerFilterRef.current = filterValues;
    const filterString = getFilterString(filterValues);
    const bannerDataToFilter = filterValues.banner ? allBannerData.current.filter(bannerData=>bannerData.bannerTemplateType === filterValues.banner) : allBannerData.current;
    if(filterString === "&filter="){
      setRows(cloneDeep(bannerDataToFilter));
      allTableBanners.current = bannerDataToFilter;
      const curPageSize = searchParams.get("pageSize")!==null ? parseInt(searchParams.get("pageSize") as string) : 10; //default 10;
      navigate(`${curPathName}?page=${0}&pageSize=${curPageSize}&filtersChanged=${true}`,{
        replace: true
      });
      setIsLoading(false);
      return;
    }
    const filteredBanner = await ChannelkartNetworkGet("/v1/bannerDistributionMDM?sort=creationTime:desc&size=1000"+filterString)
    const allowedBannerNames:string[] = filteredBanner.data.features.map((bannerObject:any)=>bannerObject.banner);
    const newRowData = bannerDataToFilter.filter(bannerObject=>allowedBannerNames.includes(bannerObject.bannerName));
    setRows(cloneDeep(newRowData));
    allTableBanners.current = newRowData;
    const curPageSize = searchParams.get("pageSize")!==null ? parseInt(searchParams.get("pageSize") as string) : 10; //default 10;
    navigate(`${curPathName}?page=${0}&pageSize=${curPageSize}&filtersChanged=${true}`,{
      replace: true
    })
    setIsLoading(false);
  }
  const bannerBehaviourOption = [
    { label: "Auto Play Video", id: "tvAdds"},
    { label: "Bucket Linked Banners", id: "bucketBanner"},
    { label: "Image", id: "banner"},
    { label: "Toggle Banner", id: "toggleBanner" }
];

  const tempcolumns: GridColDef[] = useMemo(() => [
    {
      field: "id",
      headerName: "Banner-Id",
      minWidth: 250,
      flex: 3,
      sortable: false,
      headerAlign: "center",
      align: "center",
      disableColumnMenu: true,
    },
    {
      field: "bannerName",
      headerName: translate(TranslationEnum.manage_banner,"Banner Name"),
      minWidth: 150,
      flex: 2,
      sortable: false,
      headerAlign: "center",
      align: "center",
      disableColumnMenu: true,
    },
    {
      field: "bannerDescription",
      headerName: translate(TranslationEnum.manage_banner,"Banner Description"),
      minWidth: 180,
      flex: 1,
      sortable: false,
      headerAlign: "center",
      align: "center",
      disableColumnMenu: true,
    },
    {
      field: "bannerType",
      headerName: translate(TranslationEnum.manage_banner,"Banner Type"),
      minWidth: 180,
      flex: 1,
      headerAlign: "center",
      align: "center",
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const bannerType = bannerBehaviourOption.find(option => option.id === params.value);
        return bannerType ? bannerType.label : params.value;  
      }
    },
    {
      field: "update",
      headerName: translate(TranslationEnum.common_portal,"UPDATE"),
      minWidth: 90,
      flex: 1,
      headerAlign: "center",
      align: "center",
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <button
              className="manage-basket-table-button"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                minWidth: '70px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
              }}
              onClick={async () => {
              // setCurrentBanner(params.row);
              setBannerActionsLoading(true)
              let status: string="";
              const fetchBannerStatus = async () => {
                const bannerStatus = await getBannerStatus(params.row.bannerName);
                status=bannerStatus?.[0]?.status
              };
              if(showStatus){
                await fetchBannerStatus()
              }
              setBannerActionsLoading(false)
              if(status && status==="INPROGRESS"){
                openPopup("Error","Banner Creation is in progress")
              }else{
              navigate("/create-banner",{
                state: {
                  step: "create-banner",
                  currentBanner: params.row
                }
              });
              }
              }}
            >
              {translate(TranslationEnum.common_portal,"UPDATE")}
            </button>
          </div>
        );
      },
    },
    {
      field: "delete",
      headerName: translate(TranslationEnum.common_portal,"DELETE"),
      minWidth: 90,
      editable: true,
      flex: 1,
      headerAlign: "center",
      align: "center",
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <button
              className="manage-basket-table-button"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                minWidth: '70px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
              }}
              onClick={async () => {
                setBannerActionsLoading(true)
                let status: string="";
                let time: number=0;
                const fetchBannerStatus = async () => {
                  const bannerStatus = await getBannerStatus(params.row.bannerName);
                  status=bannerStatus?.[0]?.status
                  const { minutesDifference, formattedTime } = getMinutesDifference(bannerStatus?.[0]?.last_modified_time);
                  time=minutesDifference;
                };
                if(showStatus){
                  await fetchBannerStatus()
                }
                console.log("time",time)
                setBannerActionsLoading(false)
                if(status && status==="INPROGRESS" && time < 60){
                  openPopup("Error","Banner Creation is in progress")
                }else{
                setConfirmMessage(
                  translate(TranslationEnum.manage_banner, "Are you sure you want to delete the \"{bannerName}\" banner",{"bannerName":params.row.bannerName}),
                );
                setOperationType("DELETE");
                popUpSuccessMethod.current = ()=> deleteSuccessMethod();
                setConfirmPopupState(true);
                tgtBanner.current = params.row;
                }
              }
            }
            >
              {translate(TranslationEnum.common_portal,"DELETE")}
            </button>
          </div>
        );
      },
    },
    {
      field: "deactivate",
      headerName: translate(TranslationEnum.common_portal,"Active Status"),
      minWidth: 90,
      editable: true,
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const { activeStatus } = params.row;
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Switch
              onChange={async () => {
                setBannerActionsLoading(true);
                let status: string = "";
                const fetchBannerStatus = async () => {
                  const bannerStatus = await getBannerStatus(params.row.bannerName);
                  status = bannerStatus?.[0]?.status;
                };
                if (showStatus) {
                  await fetchBannerStatus();
                }
                setBannerActionsLoading(false);
                if (status && status === "INPROGRESS") {
                  openPopup("Error", "Banner Creation is in progress");
                } else {
                  setConfirmMessage(
                    translate(
                      TranslationEnum.manage_banner,
                      `Are you sure you want to ${activeStatus === "active" ? "deactivate" : "activate"} the \"{bannerName}\" banner`,
                      { bannerName: params.row.bannerName }
                    )
                  );
                  setOperationType("STATUS");
                  popUpSuccessMethod.current = () => statusChangeSuccessMethod();
                  setConfirmPopupState(true);
                  tgtBanner.current = params.row;
                }
              }}
              checked={activeStatus === "active" ? true : false}
              offColor="#909090"
              onColor="#24c6b1"
              size={30}
              handleDiameter={25}
              uncheckedIcon={
                <div
                  style={{
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                    padding: "0 4px",
                    fontWeight: "bold",
                    color: "white",
                    lineHeight: "1",
                    textAlign: "center",
                  }}
                >
                  {translate(TranslationEnum.common_portal, "INACTIVE")}
                </div>
              }
              checkedIcon={
                <div
                  style={{
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                    padding: "0 4px",
                    fontWeight: "bold",
                    color: "white",
                    lineHeight: "1",
                    textAlign: "center",
                  }}
                >
                  {translate(TranslationEnum.common_portal, "ACTIVE")}
                </div>
              }
              height={28}
              width={85}
            />
          </div>
        );
      },
    },
  ], [translate, showStatus]);

  const columns: GridColDef[] = useMemo(() => {
    const tempCols = [...tempcolumns];
  if (showStatus) {
      tempCols.push({
      field: "status",
      headerName: "STATUS",
      minWidth: 90,
      flex: 1,
      headerAlign: "center",
      align: "center",
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        return (
          <button
            className="manageBannerActionsButton"
            onClick={() => {
              setIsModalLoading(true)
              setModelData(params.row);
              toggleModal(true);
            }}
          >
            STATUS
          </button>
        );
      },
    });
  }
    return tempCols.map((option: GridColDef) => {
    return {
      ...option,
      renderHeader: (params: GridColumnHeaderParams) => (
        <Tooltip title={option.headerName}>
          <b>{option.headerName}</b>
        </Tooltip>
      )
    }
    });
  }, [tempcolumns, showStatus, setIsModalLoading, setModelData, toggleModal]);
  async function statusChangeSuccessMethod() {
    const banner = tgtBanner.current;
    if(banner){
      const clientConfig = await getNewMetaDataConfig();
      let bannerConfig = getConfigFromClientConfig(clientConfig,"banner_configuration")?.[0]?.value;
      const couponFilterConfig = bannerConfig && bannerConfig?.find((item: { name: string; }) => item.name === "couponFilter"); 
      const newBannerPayload = getBannerStatusChangePayload(banner);
      const bannerDistributionPayload = await makeBannerDistributionData(newBannerPayload.extendedAttributes.distributionData,Boolean(couponFilterConfig?.value));
      const finalBannerPayload: bannerV2DataPayload = {
        banner: newBannerPayload,
        bannerDistribution: bannerDistributionPayload
      }
      let portal_config = clientConfigRef.current.find((config: any) => {
        return config.domainType === "portal_configuration";
      })?.domainValues;
      const useSalesHubAPI = portal_config?.find(
        (item) => item.name === "useSaleshub"
      )?.value ?? false;
      if(useSalesHubAPI){
        setBannerActionsLoading(true);
        // Transform and POST to Saleshub API
        try {
          const saleshubPayload = transformToSaleshubPayload(
            finalBannerPayload,
            true,
            tgtBanner?.current?.id
          );
          // const requestBody =
          //       saleshubPayload.length === 1
          //           ? saleshubPayload[0]
          //           : saleshubPayload;
          const requestBody = saleshubPayload;

          const response = await fetch('https://api.salescodeai.com/banners/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authorization': `${localStorage.getItem("auth_token") || defaultTokenNew}`,
            },
            body: JSON.stringify(requestBody),
          });
          if (response.ok) {
            setPopupType('Success');
            setPopupMessage('Banner updated successfully');
            setUseEffectDependendency(!useEffectDependency);
          } else {
            const err = await response.json().catch(() => ({}));
            setPopupType('Error');
            setPopupMessage('Saleshub API error: ' + (err.message || response.statusText));
          }
        } catch (e) {
          setPopupType('Error');
          setPopupMessage('Saleshub API error: ' + (e.message || e.toString()));
        } finally{
          setBannerActionsLoading(false);
        }
        return;
    }
      validateWithOtp(async (verifiedUser?: manageUpdateAccessObj,bannerResponse?: any)=>{
        setBannerActionsLoading(true);
        const validationObj = validateBannerResponse(bannerResponse);
        if (validationObj?.success) {
          setUseEffectDependendency(!useEffectDependency);
          setResetFiltersFlag(!resetFiltersFlag)
        } else {
          setPopupState(true);
          setPopupMessage(validationObj.message || "Something went wrong while updating status");
          setPopupType("Error");
        }
        setBannerActionsLoading(false);
      },undefined,undefined,"/v2/banner",finalBannerPayload,"PUT");        
 
    }
  }
  async function deleteSuccessMethod() {
    const banner = tgtBanner.current;
      if(banner?.bannerName){
        let portal_config = clientConfigRef.current.find((config: any) => {
          return config.domainType === "portal_configuration";
        })?.domainValues;
        const useSalesHubAPI = portal_config?.find(
          (item) => item.name === "useSaleshub"
        )?.value ?? false;
       if(useSalesHubAPI){
         try {
          const resp = await fetch('https://api.salescodeai.com/banners', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'authorization': localStorage.getItem("auth_token") || defaultTokenNew,
            },
          });
          if (resp.ok) {
            const saleshubData = await resp.json();
            // If API returns array, transform each

          } else {
          }
        } catch (e) {
        }
        return;
       }
        validateWithOtp(async (verifiedUser?: manageUpdateAccessObj,bannerResponse?: any)=>{
          setBannerActionsLoading(true);
          setUseEffectDependendency(!useEffectDependency);
          setResetFiltersFlag(!resetFiltersFlag);
          setBannerActionsLoading(false);
        },undefined,undefined,encodeURI(`/v1/banner/${banner.bannerName}`),undefined,"DELETE");
        setBannerActionsLoading(true);
        
        setBannerActionsLoading(false);
      }
  }
  const createRequestBodyForReport = () => {
    const requestBody: uploadReportType = {
      attributes: {
        name: "bannerReport",
        format: "xlsx"
      },
      lob: JSON.parse(localStorage.authContext).user.lob,
    };
    const filter: filterType = {
      filters: []
    }
    const bannerFilters = bannerFilterRef.current;
    if(bannerFilters){
      const filterArray = [];
      for(let key in bannerFilters){
        if(key==="banner"){
          const bannerTemplate = bannerTemplates.find((option: BannerTemplate) => {
            return option.label === bannerFilters[key];
          })?.id;
          filterArray.push({
            key: "bannerType",
            value: bannerTemplate
          })
        }else if(key==="district" || key==="branch" || key==="loginId"){
          continue;
        }else{
          filterArray.push({
            key,
            value: bannerFilters[key]
          });
        }
      }
      const locationParam = getLocationParam(bannerFilters);
      if(locationParam){
        filterArray.push({
          key: "location",
          value: locationParam
        })
      }
      if(bannerFilters["loginId"]){
        filterArray.push({
          key: "user",
          value: bannerFilters["loginId"]
        })
      }
      filter.filters = filterArray;
      requestBody.attributes.filter = filter;
    }
   
    const dataObj = JSON.stringify(requestBody);
    // generateReport(dataObj);
  };

  // const generateReport = async (obj: string) => {
  //   const requestBody = JSON.parse(obj);
  //   if (reportDownloadInProcess) {
  //     openPopup("Alert","Report downloading already in progress,please wait.");
  //     return;
  //   }
  //   setReportDownloadInProcess(true);
  //   setOpenReportModal(true);
  //   const response = await uploadReport(requestBody);
  //   checkReportStatus(response.data.id);
  // };

  // const checkReportStatus = async (id: string) => {
  //   const response = await getReportStatus(id);
  //   if (response.status === 200 && response.data.features.length > 0) {
  //     const reportMetaData = response.data.features[0];
  //     const status = reportMetaData.status;
  //     if (status === "SUCCESS" || status === "FAILURE") {
  //       await downloadReport(id);
  //       setReportDownloadInProcess(false);
  //       if (status === "FAILURE") {
  //         setOpenReportModal(false);
  //         openPopup("Error","Something Went Wrong");
  //       }
  //     } else {
  //       setTimeout(() => {
  //         checkReportStatus(id);
  //       }, 10000);
  //     }
  //   } else {
  //     openPopup(
  //       "Alert",
  //       "Looks like master data report has not been generated yet"
  //     );
  //   }
  // };
  const defaultFilter = (dataValue: string, searchedValue: string) => {
    if (!dataValue) {
        return;
    }
    dataValue = dataValue.toString();
    return dataValue.toLowerCase().includes(searchedValue.toLowerCase());
  };
  const filterBannerData = (search: string) => {
    if (search) {
        const newData = allTableBanners.current.filter((banner) => {
            const isPresent = manageBannerSearchParams.filter(
                (searchParam) => {
                    return defaultFilter(banner[searchParam], search);
                }
            );
            if (isPresent.length !== 0) {
                return true;
            } else {
                return false;
              }
          });
          setRows(newData);
      } else {
          setRows(allTableBanners.current);
      }
      const curPageSize = searchParams.get("pageSize")!==null ? parseInt(searchParams.get("pageSize") as string) : 10; //default 10;
      // navigate(`${curPathName}?page=${0}&pageSize=${curPageSize}&filtersChanged=${true}`,{ //on search take to 1st page, filtersChanged = true to set to 1st page on comming back while search
      //   replace: true
      // });
  };
  // const downloadReport = async (id: string) => {
  //   try {
  //     // const response = await downloadSupportReport(id);
  //     if (response.status === 200) {
  //       const disposition = response.headers["content-disposition"];

  //       let filename = "";
  //       if (disposition && disposition.indexOf("attachment") !== -1) {
  //         const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
  //         const matches = filenameRegex.exec(disposition);
  //         if (matches != null && matches[1]) {
  //           filename = matches[1].replace(/['"]/g, "");
  //         }
  //         const blob = new Blob([response.data], {
  //           type: "application/octet-stream",
  //         }) as Blob;
  //         const URL = window.URL || window.webkitURL;
  //         const downloadUrl = URL.createObjectURL(blob);
  //         const a = document.createElement("a");
  //         if (typeof a.download === "undefined") {
  //           openPopup("Alert","Error while downloading file");
  //         } else {
  //           a.href = downloadUrl;
  //           a.download = filename;
  //           document.body.appendChild(a);
  //           a.click();
  //           document.body.removeChild(a);
  //         }
  //       } else if (
  //         disposition &&
  //         disposition.indexOf("File is too big to download") !== -1
  //       ) {
  //         openPopup("Alert","Error while downloading file");
  //       } else {
  //         openPopup("Alert","Error while downloading file");
  //       }
  //     } else {
  //       openPopup("Alert","Error while downloading file");
  //     }

  //     setReportDownloadInProcess(false);
  //     setOpenReportModal(false);
  //   } catch (error) {
  //     openPopup("Alert","Error while downloading file");
  //     setReportDownloadInProcess(false);
  //     setOpenReportModal(false);
  //   }
  // };
  const customNoRowsOverlay = () => (
    <GridOverlay>
      <div>{translate(TranslationEnum.common_portal,"No data available")}</div>
    </GridOverlay>
  );
  return (
    <Paper className="manageBannerPaperContainer">
      {genericFilter && genericFilter.length!==0 &&
            <Box className="bannerDescriptionBoxContainer" sx={{marginBottom:"18px"}}>
                <div className='bannerDescriptionAndElementHeadingContainer'>
                <Typography className='bannerElementAndDescriptionHeading' variant="h6" pl={2} >{translate(TranslationEnum.manage_banner,"Banner Distribution")}</Typography>
                {!props.hideBackButton && <BackButton />}
            </div>
                <Box className="generic-filter-container">
                    <GenericFilters resetFiltersFlag={resetFiltersFlag} onApplyClick={onApplyClick} filterOptions={genericFilter} CUR_COMPONENT={TranslationEnum.manage_banner} />
                </Box>
            </Box>
        }
      <Box className="manageBannerBoxContainer">
        <div className="manageBannerBar">
          <div className="manageBannerBoxHeading">
            <Typography
              className="bannerReportHeading"
              variant="h6"
              pl={2}
            >
              {translate(TranslationEnum.manage_banner,"Banner Report")}
            </Typography>
          </div>
          <div className="manageBannerButtonsContainer">
            <TextField
              label={translate(TranslationEnum.common_portal,"Search")}
              name="manageBannerSearch"
              value={searchText}
              size="small"
              onChange= {(event) => {
                setSearchText(event.target.value);
                filterBannerData(event.target.value);
              }}
            />
            <Button
              className="manageBannerActionsButton manageBannerCreateButton"
              onClick={() => {
                // resetBanner();
                navigate("/create-banner", {
                  state: { step: "create-banner" }
                });
              }}
              variant="contained"
            >
              {translate(TranslationEnum.manage_banner,"Create Banner")}
            </Button>
            {/* <FontAwesomeIcon className="manageBannerExcelIcon" size="2x" icon={faFileExcel} onClick={() => {
              setConfirmMessage(
                `Are you sure you want to export to excel?`
              );
              setConfirmPopupState(true);
              popUpSuccessMethod.current = createRequestBodyForReport

              }} /> */}
            {genericFilter && genericFilter.length===0 && !props.hideBackButton && <BackButton />}
          </div>
      </div>
        {!isLoading && !isLoadingSaleshub? <div className="manageBannerDataGridContainer"><DataGrid
          className="manageBannerDataGrid"
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[10,20]}
          // hideFooter={true}
          disableRowSelectionOnClick
          paginationModel={{
            page: searchParams.get("page")!==null? parseInt(searchParams.get("page") as string) : 0,
            pageSize: searchParams.get("pageSize")!==null? parseInt(searchParams.get("pageSize") as string) : 10,
          }}
          onPaginationModelChange={(model,details) => {
            const { page, pageSize } = model;
            navigate(`${curPathName}?page=${page}&pageSize=${model.pageSize}&filtersChanged=${filtersChanged}`,{
              replace: true
            })
          }}
          slotProps={{
            pagination: {
              labelRowsPerPage: translate(TranslationEnum.common_portal,"Rows per page"),
            },
          }}
        /></div>: <Loader />}
      </Box>
      <ConfirmationPopUp
        message={confirmMessage}
        openConfirmModal={ConfirmPopupState}
        successMethod={
         popUpSuccessMethod.current
        }
        setOpenConfirmModal={setConfirmPopupState}
      />
      <GenericPopUp
        message={popupMessage}
        type={popupType}
        openGenericModal={popupState}
        setOpenGenericModal={() => {
          setPopupState(false)
          setUseEffectDependendency(!useEffectDependency)
          setResetFiltersFlag(!resetFiltersFlag)
        }}
      />
      {/* {openReportModal ? (
        <DownloadLoader
          message={"Your report will be downloaded shortly."}
          openReportModal={openReportModal}
          setOpenReportModal={setOpenReportModal}
        />
      ) : null} */}
      <Backdrop 
      open={bannerActionsLoading}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
      >
        <Loader />
      </Backdrop>
      <BannerStatusModal modelData={modelData} openModal={openModal} toggleModal={toggleModal} setIsModalLoading={setIsModalLoading} isModalLoading={isModalLoading}/>
    </Paper>
  );
}

export default NewManageBanner;
