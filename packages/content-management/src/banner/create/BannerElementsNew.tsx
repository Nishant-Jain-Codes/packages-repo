import React from "react";
import BannerTemplateOptionConfigNew from "./BannerTemplateOptionConfigNew";

function BannerElementsNew(props: any) {
  // 
  return (
    <>
      {props.bannerElements.map((bannerElement:any, index:any) => {
        return (
          <BannerTemplateOptionConfigNew
           useSaleshub={props.useSaleshub}
            key={index}
            elemNumber={index}
            bannerResolutionType={props.bannerResolutionType}
            bannerBehaviour={props.bannerBehaviour}
            elementState={bannerElement}
            setLanguageBannerState={props.setLanguageBannerState}
            checkErrors={props.checkErrors}
            categories={props.categories}
            baskets={props.baskets}
            brands={props.brands}
            languageCode={props.languageCode}
            isEdit={props.isEdit}
          />
        );
      })}
    </>
  );
}

export default BannerElementsNew;
