import React, { useContext, useEffect, useRef, useState } from 'react'
import { fetchBannerProductFilterData } from '@/features/content-management/services/bannerServices';
import { bannerProductFilter, categorySubcategoryProps, productFilterOption, productParam } from '@/features/content-management/banner/create/bannerTypes';
import GenricMultiSelect from '@/features/content-management/shared/GenericMultiSelect'
import {BannerContext} from '@/features/content-management/banner/create/BannerContext';
import SkuCodeMultiSelect from './SkuCodeMultiSelect';
import { TranslationEnum, usePortalTranslation } from '@/utils/TranslationProvider';

function CategorySubcategory(props:categorySubcategoryProps) {
  const {translate} = usePortalTranslation();
  const CUR_COMPONENT = "Manage Banner";
    const bannerConfig = useContext(BannerContext);
    const defaultSelectedOptions:{[key in productParam]?:string[]} = {};
    bannerConfig?.additionalFiltersOptions?.forEach((filter: {id: productParam})=>{
        defaultSelectedOptions[filter.id] = [];
    })

    const selectedFilterOptionsRef = useRef<{[key in productParam]?:string[]}>(defaultSelectedOptions)
    const initialLoadRef = useRef<boolean>(true);
    const isEditRef = useRef<boolean>(false);
    const [productFiltersOptions,setProductFiltersOptions] = useState<productFilterOption[]>(bannerConfig.additionalFiltersOptions);
    const [filterResetCount,setFilterResetCount] = useState<number>(0); //for handling parent component reset button by triggering useEffect

    useEffect(() => {
      async function populateValuesAndOptions(){
        const selectedFilterData: {[key in productParam]?:string[]} = {};
        bannerConfig.additionalFiltersOptions.forEach((filter: {id: productParam, options: string[]}) => {
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
    
    useEffect(() => {
      if(props.productFilterResetCounter!==0) {
        selectedFilterOptionsRef.current = {...defaultSelectedOptions};
        setFilterResetCount(filterResetCount+1);
        initialLoadRef.current = false;
      }
    },[props.productFilterResetCounter]); //initial render and when reset button is triggered

    useEffect(() => { 
      async function getAndSetProductFilters(){
        const productFilterData = await fetchBannerProductFilterData(productFiltersOptions,selectedFilterOptionsRef.current);
        setProductFiltersOptions(productFilterData);
      }
      // if(!initialLoadRef.current) getAndSetProductFilters();
    },[selectedFilterOptionsRef.current,filterResetCount]) // for getting filter options

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
      {
        productFiltersOptions.map((filterData: bannerProductFilter,index: number) => {
          return <GenricMultiSelect maxSelect={props.maxSelection} key={filterData.id + index} className="createBannerInputsMargin" options={filterData.options} label={translate(TranslationEnum.manage_banner,filterData.label || "Select " + filterData.id)} selectedOptions = {props.elementState[filterData.id] as string[] || []} handleMultiSelectState={(selectedOptions) => handleFilterSelect(selectedOptions,filterData.id) } errorMessage={"Please select " + filterData.id} isRequired={false}/>
        })
      }
        <SkuCodeMultiSelect elemNumber={props.elemNumber} languageCode={props.languageCode} elementState={props.elementState} setLanguageBannerState={props.setLanguageBannerState} initialLoadRef={initialLoadRef} selectedFilterOptionsRef={selectedFilterOptionsRef}  />
    </div>
  )

}

export default CategorySubcategory