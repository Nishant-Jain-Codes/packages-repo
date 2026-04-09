import React, { useContext, useEffect, useRef, useState } from 'react';
import { BannerContext } from '@/features/content-management/banner/create/BannerContext';
import { SkuCodeMultiSelectProps } from '@/features/content-management/banner/create/bannerTypes';
import { fetchFilteredSkuOptions } from '@/features/content-management/services/bannerServices';
import { openPopup } from '@/stateManagement/actions/popupActions';
import GenricMultiSelect from '@/features/content-management/shared/GenericMultiSelect';

function  SkuCodeMultiSelect(props: SkuCodeMultiSelectProps) {
    const { skuParamConfig, allSkuCodes } = useContext(BannerContext);
    const [skuOptions, setSkuOptions] = useState<string[]>([]);
    const [noOptionsMessage, setNoOptionsMessage] = useState<string>("Enter 4 characters to search" )
    const [allAvailableSkus,setAllAvailableSkus] = useState<string[]>(allSkuCodes);
    useEffect(()=>{
        const getAndSetSkuData = async ()=>{
            if(!props.elementState?.selectedSKUcodes) props.setLanguageBannerState((prevLanguageBannerState) => {
                const newLanguageBannerState = {...prevLanguageBannerState};
                const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
                newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState,selectedSKUcodes: []}
                return newLanguageBannerState
              });
            setSkuOptions(allAvailableSkus.slice(0, 500));
        }
        getAndSetSkuData()
    },[])

    useEffect(() => {
      async function getAndSetSkuFilteredOptions(){
        if(!props.initialLoadRef.current){
          try{
            const filteredSkuOptions = await fetchFilteredSkuOptions(props.selectedFilterOptionsRef.current,skuParamConfig.value);
            setAllAvailableSkus(filteredSkuOptions);     
            setSkuOptions(filteredSkuOptions.slice(0, 500));
            if(filteredSkuOptions.length===0) setNoOptionsMessage("No Data")
            if(!props.elementState?.selectedSKUcodes) props.setLanguageBannerState((prevLanguageBannerState) => {
              const newLanguageBannerState = {...prevLanguageBannerState};
              const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
              newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState,selectedSKUcodes: []}
              return newLanguageBannerState
            });
          }catch(err){
            openPopup("Error",`Something went wrong while fetching ${(skuParamConfig.value!=='marketSkuCode'? "SKU" : "MSKU") + " Codes"}`);
          }
        }
      }
      // getAndSetSkuFilteredOptions();
    },[props.selectedFilterOptionsRef.current])

    const handleSelectedSKUcodesState = (selectedSKUcodes: string[]) => {
      props.setLanguageBannerState((prevLanguageBannerState) => {
        const newLanguageBannerState = {...prevLanguageBannerState};
        const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
        newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState,selectedSKUcodes}
        return newLanguageBannerState
      });
    }

    const onSkuInputChange = (event:any)=>{
        const inputValue:string = event?.target?.value ? event?.target?.value.toLowerCase() : null;
        if(!inputValue ){
            const optionsToShow = allAvailableSkus.slice(0, 500) 
            setSkuOptions(optionsToShow);
            setNoOptionsMessage("No Data")
            return;

        }
        if(inputValue.length<4){
            setNoOptionsMessage("Enter 4 characters to search")
            setSkuOptions([]);
            return;
        }
        setNoOptionsMessage("No Data")
        const availableOptions = allAvailableSkus.filter(skuCode=>skuCode.toLowerCase().includes(inputValue)).slice(0, 500)
        setSkuOptions(availableOptions)
        return;
    }

    return (
        <GenricMultiSelect
            className="createBannerInputsMargin"  
            onInputChange={onSkuInputChange}
            label={"Select " + (skuParamConfig.value!=='marketSkuCode'? "SKU" : "MSKU") + " Codes"}
            options={skuOptions}
            selectedOptions={props.elementState.selectedSKUcodes || []}
            handleMultiSelectState = {handleSelectedSKUcodesState}
            isRequired = {false}
            noOptionMessage = {noOptionsMessage}
        />
    );
}

export default SkuCodeMultiSelect;