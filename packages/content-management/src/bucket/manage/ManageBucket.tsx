import { DataGrid, GridColDef, GridColumnHeaderParams, GridRenderCellParams } from '@mui/x-data-grid';
import React, { useEffect, useRef, useState } from 'react';
import './ManageBucket.css';
import { TranslationEnum, usePortalTranslation } from '@/utils/TranslationProvider';
import { Button, TextField, Tooltip } from "@mui/material";
import { defaultBucketConfig, ManageBucketConfig, manageBucketSearchParams } from './ManageBucketConfig';
import { fetchAllBuckets } from '../../services/manageBucketService';
import { metaDataBatchPayload, popupType } from '@/types';
import { bucketActionType } from './ManageBucketTypes';
import { useNavigate } from 'react-router-dom';
import Switch from "react-switch";
import { ConfirmationPopUp } from '@/components/confirmationPopUp';
import { Loader } from '@/components/loader/Loader';
import { GenericPopUp } from '@/components/popup/genericPopUp';
import { resetBanner } from '@/features/content-management/state/bannerActions';
import { bucketDesigns } from '@/features/content-management/bucket/create/bucketTypes';
import { validateWithOtp } from '@/utils/validateOtpPopupActions';
import axios from "axios";
import { manageUpdateAccessObj, getNewMetaDataConfig, openPopup, validateMetaDataResponse, getLob } from '@/utils/UtilityService';
import { defaultTokenNew, META_DATA_BATCH_API, tokenNew } from '@/utils/networkServiceSimple';
import BackButton from '@/utils/BackButton';

const CUR_COMPONENT_COMMON="commonPortal";
const CUR_COMPONENT = "Manage Bucket"

// Hardcoded token and tenant ID for saleshub API
// const SALESHUB_API_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzYWxlc2RiLWF1dGgiLCJpYXQiOjE3Njk1NzkxNjYsImV4cCI6MTc2OTYxNTE2NiwidGVuYW50X2lkIjoiYmlsMTIzNDU2IiwidXNlcl9pZCI6MjMxMzgsInVzZXJuYW1lIjoiYWRtaW5AYmlsLmNvbSIsInJvbGVzIjpbIlRFTkFOVF9BRE1JTiJdfQ.whzef3dgLJtut1PRBD-aZodw6nq5tfURpyPHDA8RZc8";

const ManageBucket = (props: { hideBackButton?: boolean }) => {
  const {translate} = usePortalTranslation();
  const [buckets,setBuckets] = useState<any[]>([]);
  const [allBuckets,setAllBuckets] = useState<any[]>([]); //will remove all the any's later
  const allBucketsRef = useRef<any[]>([]);
  const [confirmPopupMessage,setConfirmPopupMessage] = useState<string>("");
  const [bucketConfiguration,setBucketConfiguration] = useState<any>({});
  const [showLoader,setShowLoader] = useState<boolean>(false); 
  const [bucketAction,setBucketAction] = useState<bucketActionType>("changeActiveStatus");
  const [currentBucketData,setCurrentBucketData] = useState<any>({});
  const [openConfirmPopup,setOpenConfirmPopup] = useState<boolean>(false);
  
  const [popupAction,setPopupAction] = useState<popupType>("Alert");
  const [openGenericModal,setOpenGenericModal] = useState<boolean>(false);
  const [genericModalMessage,setGenericModalMessage] = useState<string>("");
  const [searchText,setSearchText] = useState<string>("");
  const [saleshubPostAPI, setSaleshubPostAPI] = useState<boolean>(false);

  const defaultFilter = (dataValue: string, searchedValue: string) => {
    if (!dataValue) {
        return;
    }
    dataValue = dataValue.toString();
    return dataValue.toLowerCase().includes(searchedValue.toLowerCase());
  };
  const filterBucketData = (search: string) => {
    if (search) {
        const newData = allBucketsRef.current.filter((bucketObj) => {
            const isPresent = manageBucketSearchParams.filter(
                (searchParam) => {
                    if(searchParam === "bucketDesign"){
                      const bucketDesignId = bucketObj["bucketDesign"];
                      const bucketDesignLabel = bucketDesigns.find((option:{id: string,label: string}) => option.id === bucketDesignId)?.label ?? bucketDesignId;
                      return defaultFilter(bucketDesignLabel, search);
                    }
                    else
                      return defaultFilter(bucketObj[searchParam], search);
                }
            );
            if (isPresent.length !== 0) {
                return true;
            } else {
                return false;
              }
          });
          setBuckets(newData);
      } else {
          setBuckets(allBucketsRef.current);
      }
  };

  async function getAndSetBuckets(){
    try{
      setShowLoader(true);
      let bucketConfig = await fetchAllBuckets();
      if(!bucketConfig){
        bucketConfig = defaultBucketConfig;
      }
      setBuckets(bucketConfig[0].value);
      setAllBuckets(bucketConfig[0].value);
      allBucketsRef.current = bucketConfig[0].value
      setBucketConfiguration(bucketConfig);
      setShowLoader(false);
    }catch(err){
      openPopup("Error","An Error occured while fetching bucket config");
    }
    
  }
  const navigate = useNavigate();
  useEffect(() => {
    getAndSetBuckets();
  },[])

  useEffect(() => {
    const fetchPortalConfig = async () => {
      try {
        const clientConfig = await getNewMetaDataConfig();
        console.log("clientConfig",clientConfig)
        const portalConfig = clientConfig?.find((config: any) => config.domainType === "portal_configuration")?.domainValues ?? [];
        const flag = portalConfig.find((item: any) => item.name === "saleshubPostAPI")?.value ?? false;
        setSaleshubPostAPI(Boolean(flag));
      } catch (error) {
        console.error("Failed to load portal_configuration for saleshubPostAPI", error);
        setSaleshubPostAPI(false);
      }
    };
    fetchPortalConfig();
  }, []);
  const columns: GridColDef[] = ManageBucketConfig.columns.map(
    (columnsMetaData) => {
      return {
        disableColumnMenu: true,
        field: columnsMetaData.mappedValue,
        headerName: translate(TranslationEnum.manage_bucket,columnsMetaData.headerName),
        valueGetter: (params: any) => {
          if(columnsMetaData.mappedValue==="bucketDesignLabel"){
            return bucketDesigns.find((option:{id: string,label: string}) => option.id === params.row.bucketDesign)?.label || "-";
          }else if(columnsMetaData.mappedValue==="primarySource" && params.row.primarySource === "pieceSize"){
            return "Pack Size";
          }else if(columnsMetaData.mappedValue==="primarySource" && params.row.primarySource === "pieceSizeDesc"){
            return "Piece Size Description";
          }
          else
          return params.row[columnsMetaData.mappedValue] || "-";
        },
        sortable: false,
        minWidth: 100,
        flex: 1,
        rowDrag: true,
        headerAlign: "left",
        align: "left",
        renderHeader: (params: GridColumnHeaderParams) => (
          <Tooltip title={translate(TranslationEnum.manage_bucket,columnsMetaData.headerName)}>
            <b>{translate(TranslationEnum.manage_bucket,columnsMetaData.headerName)}</b>
          </Tooltip>
        ),
      };
    }
  );
 
  const transformBucketToSaleshubPayload = (bucket: any, nextActive?: boolean) => {
    const type = bucket.primarySource || "";
    const primaryOptions = Array.isArray(bucket.primarySourceOptions)
      ? bucket.primarySourceOptions
      : [];
    const tags = primaryOptions
      .map((opt: any) => opt?.name)
      .filter((v: any) => typeof v === "string" && v.trim().length > 0);

    return {
      id: bucket.id,
      name: bucket.title || "",
      type: type ? String(type).toUpperCase() : "",
      config: {
        tags,
      },
      active: typeof nextActive === "boolean" ? nextActive : bucket.statusEnabled !== false,
    };
  };

  async function updateBucket(allBuckets:any[],targetBucket: any,action: bucketActionType,verifiedUser?: manageUpdateAccessObj){
    try{
        const newBucketConfiguration = [...bucketConfiguration];
        let newAllBuckets = allBuckets;

        if (action === "changeActiveStatus") {
          const isCurrentlyActive = !!targetBucket.statusEnabled;
          const nextActive = !isCurrentlyActive;

          if (saleshubPostAPI) {
            try {
              const saleshubTargetId = targetBucket.saleshubId;
              const saleshubPayload = transformBucketToSaleshubPayload(targetBucket, nextActive);
              await axios.put(
                `https://api.salescodeai.com/baskets/${saleshubTargetId}`,
                saleshubPayload,
                {
                  headers: {
                    Authorization: localStorage.getItem("auth_token") || defaultTokenNew ,
                    "Content-Type": "application/json",
                    "x-tenant-id": getLob(),
                  },
                }
              );
            } catch (saleshubUpdateError) {
              openPopup("Error","Failed to update bucket in Saleshub");
            }
          }

          newAllBuckets = allBuckets.map((bucket:any) => {
            if(bucket.id === targetBucket.id){
                return {...targetBucket, statusEnabled: nextActive};
            }else{
                return bucket;
            }
          });
        } else {
          if (saleshubPostAPI) {
            try {
              const saleshubTargetId = targetBucket.saleshubId;
              console.log("Deleting bucket from Saleshub, ID:", saleshubTargetId);
              await axios.delete(
                `https://api.salescodeai.com/baskets/${saleshubTargetId}`,
                {
                  headers: {
                    Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                    "Content-Type": "application/json",
                    "x-tenant-id": getLob(),
                  },
                }
              );
            } catch (saleshubDeleteError) {
              openPopup("Error","Failed to delete bucket in Saleshub");
            }
          }

          newAllBuckets = allBuckets.filter((bucket:any) => {
            return bucket.id!==targetBucket.id;
          });
        }
        newBucketConfiguration[0].value = newAllBuckets;
        const bucketDataPayload = {
            domainName: "clientconfig",
            domainType: "bucket_configuration",
            domainValues: newBucketConfiguration,
            lob: getLob(),
        };
        const finalMetaDataPayload: metaDataBatchPayload = { features: [bucketDataPayload] };

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
            setGenericModalMessage(
              action === "changeActiveStatus"
                ? `Bucket with id: ${currentBucketData.id} ${currentBucketData.statusEnabled ? "deactivated" : "activated"} successfully`
                : `Bucket with id: ${currentBucketData.id} deleted successfully`
            );
            setPopupAction("Success");
            setSearchText("");
            getAndSetBuckets();
          } else {
            setGenericModalMessage("Something went wrong while updating bucket data");
            setPopupAction("Error");
          }
          setOpenGenericModal(true);
        } catch (error) {
          console.log(error);
          setPopupAction("Error");
          setGenericModalMessage("Something went wrong while updating bucket data");
          setOpenGenericModal(true);
        }

        // Old OTP + metadata batch flow (kept for reference)
        // validateWithOtp((verifiedUser?: manageUpdateAccessObj,verifyResponse?: any) => {
        //   if(verifyResponse.status>=200 && verifyResponse.status<300){
        //     const validationObj = validateMetaDataResponse(verifyResponse?.data?.features);
        //     if(validationObj.success){
        //       if(action === "changeActiveStatus"){
        //         setGenericModalMessage(`Bucket with id: ${currentBucketData.id} ${currentBucketData.statusEnabled? "deactivated" : "activated"} successfully`)
        //       }else{
        //         setGenericModalMessage(`Bucket with id: ${currentBucketData.id} deleted successfully`);
        //       }
        //       setPopupAction("Success");
        //       getAndSetBuckets();
        //     }else{
        //       setGenericModalMessage(validationObj.message);
        //       setPopupAction("Error");
        //     }
        //   }else{
        //     setGenericModalMessage("Something went wrong while updating bucket data");
        //     setPopupAction("Error");
        //   }
        //   setOpenGenericModal(true);
        //   setSearchText("");
        // },undefined,"all",META_DATA_BATCH_API,finalMetaDataPayload,"PUT");
    }catch(err){
      console.log(err);
      setPopupAction("Error");
      setGenericModalMessage("Something went wrong!")
      setOpenGenericModal(true);
    }
}

  const addActionAttributes = (
    field: string,
    headerName: "",
    action: (params: GridRenderCellParams) => JSX.Element
  ) => {
    const columnConfig: any = {
      field,
      headerName,
      sortable: false,
      headerAlign: "center",
      align: "center",
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100%', 
          height: '100%' 
        }}>
          {action(params)}
        </div>
      ),
    };
    
    if (field === "ChangeStatus") {
      columnConfig.minWidth = 120;
      columnConfig.flex = 0.8;
    } else {
      columnConfig.minWidth = 100;
      columnConfig.flex = 0.7;
    }
    
    columns.push(columnConfig);
  };

  ManageBucketConfig.Actions.forEach((actionName: string) => {
    switch (actionName) {
      case "Update":
        addActionAttributes("Update", "", (params: GridRenderCellParams) => {
          return (
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
                lineHeight: '1'
              }}
              onClick={async () => {
                if(params.row.bucketDesign==="Need Based Basket Banner"){
                  const currentBucket = params.row;
                  if(!currentBucket.bannerIds && currentBucket.bannerId){
                    currentBucket.bannerIds = [currentBucket.bannerId]
                  }
                    navigate('/create-bucket',{
                      state: {
                        step: 'create-bucket',
                        buckets: allBuckets,
                        currentBucket,
                        bucketConfiguration
                      }
                    })
                }else{
                  resetBanner();
                  navigate('/create-bucket',{
                    state: {
                      step: 'create-bucket',
                      buckets: allBuckets,
                      currentBucket: params.row,
                      bucketConfiguration,
                    }
                  });
                }
                
              }}
            >
              {translate(TranslationEnum.common_portal,"UPDATE")}
            </button>
          );
        });
        break;
      case "Delete":
        addActionAttributes("Delete", "", (params: GridRenderCellParams) => {
          return (
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
                lineHeight: '1'
              }}
              onClick={() => {
                setConfirmPopupMessage(translate(TranslationEnum.manage_bucket,`Do you want to delete bucket with id: {bucketID}`,{"bucketID":params.row.id}));
                setBucketAction("delete");
                setCurrentBucketData(params.row);
                setOpenConfirmPopup(true);
              }}
            >
              {translate(TranslationEnum.common_portal,"DELETE")}
            </button>
          );
        });
        break;
      case "ChangeStatus":
        addActionAttributes(
          "ChangeStatus",
          "",
          (params: GridRenderCellParams) => {
            return (
              <Switch
              onChange={() => {
                setConfirmPopupMessage(translate(TranslationEnum.manage_bucket,`Do you want to ${params.row.statusEnabled? "deactivate" : "activate"} bucket with id: {bucketID}`,{"bucketID":params.row.id}));
                setBucketAction("changeActiveStatus");
                setCurrentBucketData(params.row);
                setOpenConfirmPopup(true);
              }}
              checked={params.row.statusEnabled === true ? true : false}
              offColor="#909090"
              onColor="#24c6b1"
              size={30}
              handleDiameter={25}
              uncheckedIcon={
                <div style={{ 
                  fontSize: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%', 
                  width: '100%',
                  padding: '0 4px',
                  fontWeight: 'bold',
                  color: 'white',
                  lineHeight: '1',
                  textAlign: 'center'
                }}>
                  {translate(TranslationEnum.common_portal,"INACTIVE")}
                </div>
              }
              checkedIcon={
                <div style={{ 
                  fontSize: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%', 
                  width: '100%',
                  padding: '0 4px',
                  fontWeight: 'bold',
                  color: 'white',
                  lineHeight: '1',
                  textAlign: 'center'
                }}>
                  {translate(TranslationEnum.common_portal,"ACTIVE")}
                </div>
              }
              height={28}
              width={85}
            />
            );
          }
        );
    }
  });
  
  return (
    <div className='manage-bucket-parent'>
        <div className="manage-bucket-header">
            <div className="manage-basket-label">
                <span>{translate(TranslationEnum.manage_bucket,"Manage Bucket")}</span>
            </div>
            <div className="manage-bucket-buttons">
              <TextField
                label={translate(TranslationEnum.common_portal,"Search")}
                name="manageBannerSearch"
                value={searchText}
                size="small"
                onChange= {(event) => {
                  setSearchText(event.target.value);
                  filterBucketData(event.target.value);
                }}
              />
                <Button
                className="manage-bucket-create-new"
                onClick={() => {
                  resetBanner();
                   navigate('/create-bucket',{
                    state: {
                      step: 'create-bucket',
                      buckets: allBuckets,
                      bucketConfiguration
                    }
                  });
                }}
                >
                {translate(TranslationEnum.manage_bucket,"CREATE BUCKET")}
                </Button>
                {!props.hideBackButton && <BackButton/>}
            </div>
        </div>
        <div className='manage-bucket-table'>
            {!showLoader?<DataGrid
                rows={ buckets}
                columns={columns}
                rowSelection={false}
                initialState={{
                  sorting: {
                    sortModel: [{ field: "id", sort: "asc" }],
                  },
                }}
                slotProps={{
                  pagination: {
                    labelRowsPerPage: translate(TranslationEnum.common_portal,"Rows per page"),
                  },
                }}
            />: <Loader />}
        </div>
        <ConfirmationPopUp 
          openConfirmModal={openConfirmPopup}
          message={confirmPopupMessage}
          setOpenConfirmModal={() => {
            setOpenConfirmPopup(false);
          }}
          successMethod={() => {
           updateBucket(allBucketsRef.current,currentBucketData,bucketAction);
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

export default ManageBucket;