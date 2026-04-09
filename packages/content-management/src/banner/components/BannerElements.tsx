import React from "react";
import { bannerElementsProps } from "@/features/content-management/banner/create/bannerTypes";
import BannerTemplateOptionConfig from "./BannerTemplateOptionConfig";

function BannerElements(props: bannerElementsProps) {
  return (
    <>
      {props.bannerElements.map((bannerElement, index) => {
        return (
          <BannerTemplateOptionConfig
            key={index}
            elemNumber={index}
            bannerTemplateType={props.bannerTemplateType}
            elementState={bannerElement}
            setLanguageBannerState={props.setLanguageBannerState}
            checkErrors={props.checkErrors}
            categories={props.categories}
            baskets={props.baskets}
            languageCode={props.languageCode}
            isEdit={props.isEdit}
          />
        );
      })}
    </>
  );
}

export default BannerElements;
