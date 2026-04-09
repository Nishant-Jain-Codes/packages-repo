import { Button, TextField, Tooltip } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridColumnHeaderParams,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import Switch from "react-switch";
import React, { useEffect, useRef, useState } from "react";
import { getAllBasket} from "../../services/manageBasketService";
import { Loader } from "@/components/loader/Loader";
import { defaultBasketConfig, ManageBasketConfig, manageBasketSearchParams } from "./ManageBasketConfig";
import "./ManageBasket.css";

import { useNavigate } from "react-router-dom";
import { metaDataBatchPayload, popupType } from "@/types";
import { ConfirmationPopUp } from "@/components/confirmationPopUp";
import {
  basketDoaminType,
  basketRequestBody,
  valueType,
} from "./ManageBasketTypes";
import axios from "axios";
import { GenericPopUp } from "@/components/popup/genericPopUp";
import { validateWithOtp } from "@/utils/validateOtpPopupActions";
import { manageUpdateAccessObj, updateConfigRequestBody, validateMetaDataResponse, getNewMetaDataConfig, getLob } from "@/utils/UtilityService";
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";
import BackButton from "@/utils/BackButton";
import { META_DATA_BATCH_API, ChannelkartNetworkDelete, tokenNew, defaultTokenNew } from "@/utils/networkServiceSimple";

const ManageBasket = (props: { hideBackButton?: boolean}) => {
  const { translate } = usePortalTranslation();
  const [rows, setRows] = useState<valueType[]>([]);
  const [loader, setLoader] = useState(true);
  const navigate = useNavigate();

  const [genericModalState, setGenericModalState] = useState(false);
  const [genericModalMessage, setGenericModalSMessage] = useState("");
  const [genericModaltype, setGenericModalType] = useState<popupType>("Error");

  const [confirmationPopUp, setConfirmationPopUp] = useState(false);
  const [popUpMessage, setPopUpMessage] = useState<string>("");
  const popUpSuccessMethod = useRef<any>();
  const basketConfigurationRef = useRef<any>([]);
  const allBasketsRef = useRef<any[]>([]);
  const [searchText,setSearchText] = useState<string>("");
  const [saleshubPostAPI, setSaleshubPostAPI] = useState<boolean>(false);

  const domainValues = useRef<basketDoaminType[] | null>(null);

  const openPopUp = (message: string, modalType: popupType) => {
    setGenericModalSMessage(message);
    setGenericModalState(true);
    setGenericModalType(modalType);
  };

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
  const defaultFilter = (dataValue: string, searchedValue: string) => {
    if (!dataValue) {
        return;
    }
    dataValue = dataValue.toString();
    return dataValue.toLowerCase().includes(searchedValue.toLowerCase());
  };
  const filterBasketData = (search: string) => {
    if (search) {
        const newData = allBasketsRef.current.filter((basketObj) => {
            const isPresent = manageBasketSearchParams.filter(
                (searchParam) => {
                      return defaultFilter(basketObj[searchParam], search);
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
          setRows(allBasketsRef.current);
      }
  };
  const getAllBasketData = async () => {
    try {
      const response = await getAllBasket();
      const orderBasketConfigData = response.find(
        (eachConfig: any) => {
          return eachConfig.domainType === "order_basket_configuration";
        }
      );
      if (orderBasketConfigData) {
        domainValues.current = orderBasketConfigData.domainValues;
        if (domainValues.current) {
          const allBasketData = domainValues.current[0].value;
          if(allBasketData){
            setRows(allBasketData);
            allBasketsRef.current = allBasketData;
            setLoader(false);
          }
          else{
            throw new Error();
          }
        } else {
          throw new Error();
        }
      }
      else{
        domainValues.current = defaultBasketConfig as basketDoaminType[];
        const allBasketData = domainValues.current[0].value;
          if(allBasketData){
            setRows(allBasketData);
            setLoader(false);
          }
      }
    } catch (error) {
      setRows([]);
      openPopUp("Something went wrong", "Error");
      setLoader(false);
    }
  };

  useEffect(() => {
    getAllBasketData();
  }, []);
  const columns: GridColDef[] = ManageBasketConfig.columns.map(
    (columnsMetaData) => {
      return {
        disableColumnMenu: true,
        field: columnsMetaData.mappedValue,
        headerName: columnsMetaData.headerName,
        sortable: false,
        minWidth: 100,
        flex: 1,
        headerAlign: "left",
        align: "left",
        renderHeader: (params: GridColumnHeaderParams) => (
          <Tooltip title={columnsMetaData.headerName}>
            <b>{translate(TranslationEnum.manage_basket,columnsMetaData.headerName)}</b>
          </Tooltip>
        ),
      };
    }
  );

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

  const updateConfirmationPopData = (
    message: string,
    methodHelper: () => void
  ) => {
    popUpSuccessMethod.current = methodHelper;
    setPopUpMessage(message);
  };

  const updateBasketData = async (id: string, action: string,verifiedUser?: manageUpdateAccessObj) => {
    try {
      let newValue;
      if (action === "delete") {
        const targetRow = allBasketsRef.current.find((eachRow: valueType) => eachRow.id === id);
        const saleshubId = targetRow?.saleshubId;
        const saleshubTargetId = saleshubId || id;

        if (saleshubPostAPI) {
          try {
            await axios.delete(
              `https://api.salescodeai.com/baskets/${saleshubTargetId}`,
              {
                headers: {
                  Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                  "Content-Type": "application/json",
                  "x-tenant-id": getLob(),
                }
              }
            );
          } catch (saleshubError) {
            console.error("Failed to delete basket from Saleshub:", saleshubError);
          }
        }
        newValue = allBasketsRef.current.filter((eachRow: valueType) => {
          return eachRow.id !== id;
        });
      } else {
        const targetRow = allBasketsRef.current.find((eachRow: valueType) => eachRow.id === id);

        if (saleshubPostAPI && targetRow) {
          const saleshubTargetId = targetRow?.saleshubId || id;
          const isCurrentlyActive = targetRow.status === "active";
          const nextActive = !isCurrentlyActive;
          const tags = targetRow.tag ? [targetRow.tag] : [];
          const type = targetRow.type ? String(targetRow.type).toUpperCase() : "RECOMMENDATION";

          const saleshubPayload = {
            name: targetRow.title || "",
            type,
            config: {
              tags,
            },
            active: nextActive,
          };

          try {
            await axios.put(
              `https://api.salescodeai.com/baskets/${saleshubTargetId}`,
              saleshubPayload,
              {
                headers: {
                  Authorization: localStorage.getItem("auth_token") || defaultTokenNew,
                  "x-tenant-id": getLob(),
                  "Content-Type": "application/json",
                },
              }
            );
          } catch (saleshubUpdateError) {
            console.error("Failed to update basket in Saleshub:", saleshubUpdateError);
            // Continue with local status toggle even if Saleshub update fails
          }
        }

        newValue = allBasketsRef.current.map((eachRow: valueType) => {
          if (eachRow.id === id) {
            return {
              ...eachRow,
              status: eachRow.status === "active" ? "inactive" : "active",
            };
          }
          return eachRow;
        });
      }
      if (domainValues.current) {
        domainValues.current[0].value = newValue;
      }
      console.log("domainValues.current",domainValues.current);
      const basketDataPayload: updateConfigRequestBody = {
        domainName: "clientconfig",
        domainType: "order_basket_configuration",
        domainValues: domainValues.current as any,
        lob: getLob(),
      };
      console.log("basketDataPayload",basketDataPayload);
      const finalMetaDataPayload: metaDataBatchPayload = { features: [basketDataPayload] };
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
          // // const validationObj = validateMetaDataResponse(response?.data?.features);
          // if (validationObj.success) {
          //   setSearchText("");
          //   setLoader(true);
          //   getAllBasketData();
          // } else {
          //   openPopUp(validationObj.message, "Error");
          // }
          setSearchText("");
          setLoader(true);
          getAllBasketData();
        } else {
          openPopUp("Something went wrong", "Error");
        }
      } catch (error) {
        console.error("Failed to update basket configuration via S3 API:", error);
        openPopUp("Something went wrong", "Error");
      }

      // validateWithOtp((verifiedUser?: manageUpdateAccessObj,verifyResponse?: any) => {
      //   if (verifyResponse.status >= 200 || verifyResponse.status < 300) {
      //     const validationObj = validateMetaDataResponse(verifyResponse?.data?.features);
      //     if(validationObj.success){
      //       setSearchText("");
      //       setLoader(true);
      //       getAllBasketData();
      //     }else{
      //      openPopUp(validationObj.message,"Error");
      //     }
      //   } else {
      //     openPopUp("Something went wrong", "Error");
      //   }
      // },undefined,"all",META_DATA_BATCH_API,finalMetaDataPayload,"PUT");
    } catch (error) {
      openPopUp("Something went wrong", "Error");
    }
  };

  ManageBasketConfig.Actions.forEach((actionName: string) => {
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
              onClick={() => {
                navigate("/create-basket", {
                  state: {
                    step: 'create-basket',
                    row: params.row,
                    domainValues: domainValues.current,
                  },
                });
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
                setConfirmationPopUp(true);
                updateConfirmationPopData(
                  "Are you sure you want to delete the basket",
                  () => {
                    updateBasketData(params?.row?.id, "delete");
                  }
                );
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
                  setConfirmationPopUp(true);
                  updateConfirmationPopData(
                    params.row.status === "active"
                      ? "Are you sure you want to deactivate the basket"
                      : "Are you sure you want to activate the basket",
                    () => {
                     updateBasketData(params?.row?.id, "update"); 
                    }
                  );
                }}
                checked={params.row.status === "active" ? true : false}
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
    <>
      <div className="manage-basket-parent">
        <div className="manage-basket-header">
          <div className="manage-basket-label">
            <span>{translate(TranslationEnum.manage_basket,"Manage Basket")}</span>
          </div>
          <div className="manage-basket-buttons">
            <TextField
              label={translate(TranslationEnum.common_portal,"Search")}
              name="manageBannerSearch"
              value={searchText}
              size="small"
              onChange= {(event) => {
                setSearchText(event.target.value);
                filterBasketData(event.target.value);
              }}
            />
            <Button
              className="manage-basket-create-new"
              onClick={() => {
                navigate("/create-basket", {
                  state: {
                    step: 'create-basket',
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
                      backGroundColor:"",
                      titleColor:"",
                      subTitleColor:""
                    },
                    domainValues: domainValues.current,
                  },
                });
              }}
            >
              {translate(TranslationEnum.manage_basket,"Create Basket").toUpperCase()}
            </Button>
            {!props.hideBackButton && <BackButton/>}
          </div>
        </div>
        {loader ? (
          <Loader />
        ) : (
          <div className="manage-basket-table">
            <DataGrid
              disableRowSelectionOnClick={true}
              sx={{
                "&.MuiDataGrid-root .MuiDataGrid-cell:focus-within": {
                   outline: "none !important",
                },
             }}
              rows={rows}
              columns={columns}
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
            />
          </div>
        )}

        <ConfirmationPopUp
          openConfirmModal={confirmationPopUp}
          message={popUpMessage}
          setOpenConfirmModal={() => {
            setConfirmationPopUp(false);
          }}
          successMethod={popUpSuccessMethod.current}
        />
        <GenericPopUp
          type={genericModaltype}
          message={genericModalMessage}
          openGenericModal={genericModalState}
          setOpenGenericModal={() => {
            genericModaltype === "Success" && getAllBasketData();
            setGenericModalState(false);
          }}
        />
      </div>
    </>
  );
};

export default ManageBasket;
