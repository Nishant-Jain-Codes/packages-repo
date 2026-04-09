import React from "react";
import { bannerLanguageSelectionProps } from "@/features/content-management/banner/create/bannerTypes";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import './CreateBanner.css';
import { openPopup } from "@/stateManagement/actions/popupActions";
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";

function BannerLanguageSelection(props: bannerLanguageSelectionProps) {
  const CUR_COMPONENT = "Manage Banner"
  const { translate } = usePortalTranslation();
  function handleTabChange(
    event: React.SyntheticEvent<Element, Event>,
    value: number
  ) {
    const curLangBannerValidationResult = props.validateCurLanguageBannerElements(props.languageBannerState[props.languageOptions[props.selectedTab].code],0,false);
    if(curLangBannerValidationResult.invalidCount!==0){
      const finalMessage = curLangBannerValidationResult.invalidCount>1? "Fill all the fields of elements for which Banner Type is selected": curLangBannerValidationResult.message;
      openPopup("Alert",finalMessage);
      return;
    }
    props.setSelectedTab(value);
  }
  return (
    <Box className="bannerElementBoxContainer">
      <div className="bannerDescriptionAndElementHeadingContainer">
        <Typography
          className="bannerElementAndDescriptionHeading"
          variant="h6"
          pl={2}
        >
          {translate(TranslationEnum.manage_banner,"Language Selection")}
        </Typography>
      </div>
      <div className="bannerLanguageTabsContainer">
        <Tabs
          value={props.selectedTab}
          variant="scrollable"
          scrollButtons={false}
          TabIndicatorProps={{
            hidden: true
          }}
          onChange={handleTabChange}
        >
          {props.languageOptions.map((languageObj) => {
            return (
              <Tab
                className="bannerLanguageTab"
                disableRipple
                key={languageObj.code}
                label={translate(TranslationEnum.manage_banner,languageObj.language)}
              />
            );
          })}
        </Tabs>
      </div>
    </Box>
  );
}

export default BannerLanguageSelection;
