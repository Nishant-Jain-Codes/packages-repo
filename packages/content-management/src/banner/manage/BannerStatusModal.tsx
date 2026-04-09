import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Modal } from '@mui/material';
import React, { useEffect, useState } from 'react'
import { getBannerStatus, retryBannerDistribution } from '../../services/bannerServices';
import success from '@/assets/svg/success.svg';
import failure from '@/assets/svg/Failure.svg';
import inProgress from '@/assets/svg/In progress.svg';
import "./BannerStatusModal.css"
import { openPopup } from '@/utils/UtilityService';
import { Loader } from '@/components/loader/Loader';
import moment from 'moment';


interface BannerStatusModalProps {
    modelData:any;
    openModal: boolean;
    toggleModal: (open: boolean) => void;
    setIsModalLoading: React.Dispatch<React.SetStateAction<boolean>>;
    isModalLoading:Boolean
}
const BannerStatusModal = ({
    modelData,
    openModal,
    toggleModal,
    setIsModalLoading,
    isModalLoading
}: BannerStatusModalProps) => {
    const[data,setData]=useState<any>()
    const[bannerName,setBannerName]=useState<String>("")
    useEffect(()=>{
        if(modelData && openModal){
            const fetchBannerStatus = async () => {
                const bannerStatus = await getBannerStatus(modelData.bannerName);
                setData(bannerStatus)
                setBannerName(modelData.bannerName)
                setIsModalLoading(false)
            };
            fetchBannerStatus();
        }
    },[modelData,openModal])

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
    
    const getButtonColor = (status: string): "secondary" | "error" | "success" | "warning" => {
        switch (status) {
            case 'FAILURE':
                return 'error';
            case 'SUCCESS':
                return 'success';
            case 'INPROGRESS':
                return 'warning';
            default:
                return 'secondary';
        }
    };
    return (
        <Modal
            style={{ zIndex: 100 }}
            open={openModal}
            onClose={() => {
                toggleModal(false);
            }}
        >
            {!isModalLoading ? <Box className="modal-box">
                <div className="modal-header">
                    <p>Status Of Banner - {bannerName}</p>
                    <div className="model-header-icon">
                        <FontAwesomeIcon
                            className="model-sign"
                            fontSize="30px"
                            icon={faXmark}
                            onClick={() => toggleModal(false)}
                        />
                    </div>
                </div>
                <div className='status-container'>
                {data && data.map((item:any, index:any) => {
                    const { minutesDifference, formattedTime } = getMinutesDifference(item.last_modified_time);
                    const isTopMostEntry = index === 0;
                    return (
                        <div key={index} className="status-row">
                            <div className="status-heading">
                                <div>
                                    Last Updated Time: <span className="status-time">{formattedTime}</span> 
                                </div>
                                <div className="status-type">
                                    <Button variant="outlined" color={getButtonColor(item.status)} style={{pointerEvents:"none"}}>
                                        {item.status}
                                    </Button>
                                    <img className="status-image" src={item.status==="SUCCESS" ? success : item.status==="FAILURE" ? failure : inProgress} alt="status" />
                                </div>
                            </div>
                            <div style={{paddingBottom:"10px",display:"flex"}}>
                            {isTopMostEntry && item.status === "FAILURE" && (
                                <div className="retry-button-container">
                                    <Button style={{backgroundColor:"#00C6B1"}} variant="contained" color="primary" onClick={() => {retryBannerDistribution(item.attributes);openPopup("Success","Banner Retried Successfully");toggleModal(false);}}>
                                        Retry
                                    </Button>
                                </div>
                            )}
                            {isTopMostEntry && item.status === "INPROGRESS" && minutesDifference > 60 && (
                                <div className="retry-button-container">
                                    <Button variant="contained" color="primary" onClick={() => {retryBannerDistribution(item.attributes);openPopup("Success","Banner Retried Successfully");toggleModal(false);}}>
                                        Retry
                                    </Button>
                                </div>
                            )}
                            </div>
                        </div>
                    );
                })}
                </div> 
            </Box> : <Loader/>}
        </Modal>
    )
}

export default BannerStatusModal