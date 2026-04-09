import React, { useContext, useEffect, useRef, useState } from 'react'
import { categorySubcategoryProps, productFilterOption, productParam } from '@/features/content-management/banner/create/bannerTypes';
import GenricMultiSelect from '@/features/content-management/shared/GenericMultiSelect'
import {BannerContext} from '@/features/content-management/banner/create/BannerContext';

function AppSchemeFilter(props:categorySubcategoryProps) {
    const bannerConfig = useContext(BannerContext);
    const defaultSelectedOptions:{[key in productParam]?:string[]} = {};
    const selectedFilterOptionsRef = useRef<{[key in productParam]?:string[]}>(defaultSelectedOptions)
    const initialLoadRef = useRef<boolean>(true);
    const isEditRef = useRef<boolean>(false);
    const [schemeFiltersOptions,setSchemeFiltersOptions] = useState<string[]>(bannerConfig.schemeFilter);

    useEffect(() => {
      async function populateValuesAndOptions(){
        const selectedFilterData: {[key in productParam]?:string[]} = {};
        bannerConfig.schemeFilter.forEach((filter: {id: productParam, options: string[]}) => {
          if(props.elementState[filter.id]){ 
            selectedFilterData[filter.id] = props.elementState[filter.id] as string[];
            isEditRef.current = true;
          }
        })
        if(isEditRef.current){
          selectedFilterOptionsRef.current = {...selectedFilterOptionsRef.current,...selectedFilterData};
          initialLoadRef.current = false;
        }
      }
      populateValuesAndOptions();
    },[]) 

    async function handleFilterSelect(selectedOptions: string[],filterId: productParam){
      props.setLanguageBannerState((prevLanguageBannerState => {
        const newLanguageBannerState = {...prevLanguageBannerState};
        const curElementState = newLanguageBannerState[props.languageCode][props.elemNumber];
        newLanguageBannerState[props.languageCode][props.elemNumber] = {...curElementState,[filterId]: selectedOptions};
        return newLanguageBannerState;
      }));
      initialLoadRef.current = false;
      selectedFilterOptionsRef.current = { ...selectedFilterOptionsRef.current, [filterId]: selectedOptions};// will trigger its useEffect and that will fetch filterd options
    }
  return (
    <div>
      <GenricMultiSelect autoSelect={props.autoSelectScheme} maxSelect={props.maxSelection} key={"scheme"} className="createBannerInputsMargin" options={schemeFiltersOptions} label={"Select Scheme Id"} selectedOptions = {props.elementState["schemeId"] as string[] || []} handleMultiSelectState={(selectedOptions) => handleFilterSelect(selectedOptions,"schemeId") } errorMessage={"Please select schemeId"} isRequired={false}/>
    </div>
  )

}

export default AppSchemeFilter