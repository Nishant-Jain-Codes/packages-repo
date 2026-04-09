import React, { ChangeEvent } from "react";
import { TextField } from '@mui/material';
import { validateYoutubeUrl } from '@/features/content-management/services/bannerServices';
import { youtubeLinkInputsProps } from '@/features/content-management/banner/create/bannerTypes';
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";

const YoutubeLinkInputs = (props: youtubeLinkInputsProps) => {
  const { translate } = usePortalTranslation();
  const CUR_COMPONENT_COMMON="commonPortal";
  const handleURL = (event: ChangeEvent<HTMLInputElement>) => {
    props.setLanguageBannerState((prevLanguageBannerState) => {
      const newLanguageBannerState = {...prevLanguageBannerState};
      const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
      newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState, mediaUrl: event.target.value};
      return newLanguageBannerState;
    });
  }
    const isValid = validateYoutubeUrl(props.elementState.mediaUrl || "");
  return (
    <div className='bannerInputsContainer youtubeInputsContainer'>
        <TextField className="createBannerInputsMargin" id="youtubeURL" label={`${translate(TranslationEnum.common_portal,"URL")}*`} value={props.elementState.mediaUrl?props.elementState.mediaUrl:""} error={props.checkErrors && !isValid} helperText={props.checkErrors && !isValid && translate(TranslationEnum.common_portal,"Please enter a valid Youtube URL") } onChange={handleURL} variant="outlined" />
    </div>
  )
}

export default YoutubeLinkInputs;