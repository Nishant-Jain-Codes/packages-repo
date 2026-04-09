import { omit } from "lodash";
import { bannerData, productDetailsResponse, productFilterOption, productMetadataSkuObj, productParam } from "@/features/content-management/banner/create/bannerTypes";
import { ChannelkartNetworkDelete, ChannelkartNetworkGet, ChannelkartNetworkPost, defaultTokenNew, tokenNew} from "@/utils/networkServiceSimple";
import {store} from "@/utils/UtilityService";
import { manageUpdateAccessObj } from "@/utils/UtilityService";
import { BannerTemplate, configurationAttributeType } from "@/utils/UtilityService";
import { bannerTemplates } from "@/features/content-management/banner/create/bannerTemplates";
import { getMarketTabsList } from "@/utils/couponMarketDetailsUtils";
import { validateMetaDataResponse } from "@/utils/UtilityService";
import { getToken } from "@/utils/UtilityService";
import _ from "lodash";
const sizeParam = 10000;
//createBanner Services
export function validateYoutubeUrl(url:string) {
    if (!url) {
      return false;
    }
    var pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/; // eslint-disable-line
  
    return pattern.test(url);
  
    // const regExp = /^(https?\:\/\/)?((www\.)?youtube\.com|youtu\.be)\/(watch\?v=|v\/|u\/\w\/|embed\/?)?([a-zA-Z0-9_-]{11})$/; // eslint-disable-line
    // const match = url.match(regExp);
  
    // return match !== null && (url.startsWith('https://') || url.startsWith('http://'));
}
export function validateGoogleUrl(url:string){
    if(!url){
        return false;
    }
    const pattern = new RegExp(
        '^(https?:\\/\\/)' + // protocol
          '(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.){1,}[a-z]{2,}' + // domain name
        //'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+:]*)*' + // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        //   '(\\#[-a-z\\d_]*)?$', // fragment locator
        '(\\#[-a-z\\d%_.~+\\/]*)?$',
        'i'
      );
  return !!pattern.test(url);
}
export async function uploadImages(formData: FormData){
    try{
        
        let url = "/v1/uploadMultipleFiles/images";
        const response = await ChannelkartNetworkPost(url, formData,{"Content-Type": "multipart/form-data"})
        const blobUrls = [];
        for(let urlNum=0;urlNum<response.data.length;urlNum++){
            const body = JSON.parse(response.data[urlNum].body);
            blobUrls.push(body?.features?.[0]?.Uri);
        }
        return blobUrls;
    }catch(err){
        return { message: "Something went wrong, Try again"}
    }
    
} 

const getLocationId:any = async (filters:any) => {
    try {
      const response = await ChannelkartNetworkGet(
        `/locations?size=5000&filter=${filters}`
      );
      const ids = response.data.features.map((feature: { id: string; }) => feature.id);
      return ids;
    } catch (error) {
      console.error(error)
    }
  };

export async function makeBannerDistributionData(distributionObject:any,couponFilterConfig?:boolean){
    if(couponFilterConfig){
        let marketLevelTabsList = store.getState().manageCoupons.configData?.marketLevelTabsList || [];
        if(marketLevelTabsList.length===0){
            marketLevelTabsList = await getMarketTabsList();
        }
            const allFieldsEmpty = marketLevelTabsList.every((key: string | number) => {
                return !distributionObject.hasOwnProperty(key) || distributionObject[key].split(',').length === 0;
            });
            if (!allFieldsEmpty) {
                const filters = marketLevelTabsList.map((key: string | number) => {
                    if (distributionObject?.[key]) {
                        let values
                        if (distributionObject[key].includes('$*$')) {
                            values = distributionObject[key].split('$*$');
                            values = values.map((value: string) => value.replace(",", "%2C"));
                        } else {
                            values = [distributionObject[key].replaceAll(",", "%2C")];
                        }
                        if (values.length > 0) {
                            return `${key}[in]:[${values.join(',')}]`;
                        }
                    }
                }).filter(Boolean); 
                const urlParameters = filters.join(' and ');
                const locationIds = await getLocationId(urlParameters);
                const location = marketLevelTabsList.map((key:any) => {
                    if (distributionObject[key]) {
                        // return [key, distributionObject[key].split('$*$').map(r => r.trim()).join(',')];
                        return [key, distributionObject[key]];
                    }
                    return null;
                }).filter(Boolean);
                const locationObject = location.reduce((acc: { [x: string]: any; }, [key, value]: any) => {
                    acc[key] = value;
                    return acc;
                }, {});
                distributionObject.location = locationObject
                // distributionObject.locationId = locationIds.join(",");
            }
        if((distributionObject?.loginId) || (distributionObject?.asm)){
            if(distributionObject?.loginId){
                // distributionObject.supplier=distributionObject?.loginId.split('$*$').join(',')
                distributionObject.supplier=distributionObject?.loginId
            }else{
                let idsWithName;
                if (distributionObject.asm.includes('$*$')) {
                    idsWithName = distributionObject.asm.split('$*$');
                }else{
                    idsWithName = distributionObject.asm.split(',');
                }
                const asmIds = idsWithName.map((name: string) => name.split(" (")[0]);
                distributionObject.supplier=asmIds.join(",");
            }
        }
        // if(distributionObject.channel){
        //     distributionObject.channel=distributionObject.channel.split('$*$').join(',')
        // }
        if(distributionObject.outletCode && distributionObject.outletCode.includes('$*$')){
            distributionObject.outletCode=distributionObject.outletCode.split('$*$').join(',')
        }
        distributionObject = omit(distributionObject,["distributorDetails","district","region","state","town","asm","loginId"]);
        return distributionObject;
    }else{
        const location:{
            district?: string;
            branch?: string;
            region?: string;
            city?: string;
            state?: string;
            regionCode?: string;
        } = {};
        const locationData = store.getState().locationData;
        if((distributionObject?.branch || distributionObject?.district || distributionObject?.region || distributionObject?.zone || distributionObject?.state || distributionObject?.regionCode) && locationData){
            // const locations:string[] = distributionObject.branch ? distributionObject.branch.split(",") : distributionObject.district.split(",");
            // distributionObject.locationId = locations.map(location=>locationData[location]).join(",");
            if (distributionObject?.district) {
                location.district = distributionObject.district.split(',').join('$*$');
            } 
            if (distributionObject?.branch) {
                location.branch = distributionObject.branch.split(',').join('$*$');
            }
            if (distributionObject?.region) {
                location.region = distributionObject.region.split(',').join('$*$');
            }
            if (distributionObject?.regionCode) {
                location.regionCode = distributionObject.regionCode.split(',').join('$*$');
            }
            if (distributionObject?.state) {
                location.state = distributionObject.state.split(',').join('$*$');
            }
            if (distributionObject?.city) {
                location.city = distributionObject.city.split(',').join('$*$');
            }
            distributionObject.location = location
        }
        if(distributionObject?.loginId){
            distributionObject.supplier = distributionObject?.loginId ?? null;
        }
        if(distributionObject?.loyaltyType || distributionObject?.outletClass){
            distributionObject.outletClass = distributionObject?.loyaltyType ?? distributionObject?.outletClass ;	
        }
        distributionObject = omit(distributionObject,["branch","loginId","district","loyaltyType","state","city","zone","region","regionCode","bannerDesignation"]);
        Object.keys(distributionObject).forEach((key) => {
            if (distributionObject?.[key] === '') {
                delete distributionObject[key];
            }
        });
        return distributionObject;
    }  
}
export async function sendBannerDistribution(bannerPayload: any,isEdit: boolean, verifiedUser?: manageUpdateAccessObj,couponFilterConfig?: any){
    try{
        let url2 = verifiedUser? `/v1/bannerDistribution?verifiedBy=${verifiedUser.phoneNumber}` : "/v1/bannerDistribution";
        const bannerDistibutionData = await makeBannerDistributionData(bannerPayload.extendedAttributes.distributionData,couponFilterConfig)
        const distributionResponse = await ChannelkartNetworkPost(url2, bannerDistibutionData ,{"Content-Type": "application/json"});
        return {message: "Banner created successfully", success: distributionResponse.status===201 };
    }catch(err){
        return {message: "An Error Occured while updating banner distribution", success: false }
    }

}

export async function getUniqueProductCategories(){
    let url = "/v1/query/UniqueProductCategory?source=portal&callType=scheduled";
    try{
        const response = await ChannelkartNetworkGet(url);
        if(response.status===200){
            return response.data.features;
        }else{
            return [];
        }
        
    }catch(err){
        return [];
    }
}
export async function getSalesHubUniqueProductCategories(){
    let url = "https://api.salescodeai.com/catalog/meta?type=category&size=10000";
    try{
        const response = await ChannelkartNetworkGet(url,localStorage.getItem("auth_token") || defaultTokenNew);
        if(response.status===200){
            return response.data.features;
        }else{
            return [];
        }
        
    }catch(err){
        return [];
    }
}

export async function fetchAllSubCategories(selectedCategories: string[]){
    let filterParams = selectedCategories.map(category => "'" + category + "'").join();
    let url = "/v1/distinctFieldData/productDetails/subCategoryCode?filter=category[in]:["+encodeURIComponent(filterParams)+"]";
    try{
        const response = await ChannelkartNetworkGet(url);
        if(response.status===200){
            return response.data;
        }else{
            return [];
        }
        
    }catch(err){
        return [];
    }
}

export async function fetchAllSKUcodes(skuCodekey: string,useSalesHubAPI?:boolean,selectedCategories?: string[],selectedSubCategoriesCodes?: string[] | undefined){
    try{
        if (useSalesHubAPI) {
            let url = "https://api.salescodeai.com/catalog/meta?type=category&size=10000";
            const response = await ChannelkartNetworkGet(url, localStorage.getItem("auth_token") || defaultTokenNew);
            if(response.status===200){
                return {
                    data: response.data,
                    skuCodekey
                }
            }else{
                return {
                    data: [],
                    skuCodekey
                };
            }
        }
        else if(skuCodekey!=="productMetaDataSku"){
            let filterSubCategoryCodesParams = selectedSubCategoriesCodes? selectedSubCategoriesCodes.map(subCategoryCode => "'" + subCategoryCode + "'").join() : [].map(subCategoryCode => "'" + subCategoryCode + "'").join();
            let url = "";
            if(!selectedCategories?.length){
                url = "/v1/distinctFieldData/productDetails/" + skuCodekey + `?size=${sizeParam}`;
            }else{
                let filterCategoryParams = selectedCategories.map(category => "'" + category + "'").join();
                url = selectedSubCategoriesCodes?.length ? "/v1/distinctFieldData/productDetails/" + skuCodekey + "?filter=category[in]:["+encodeURIComponent(filterCategoryParams)+"] and subCategoryCode[in]:["+encodeURIComponent(filterSubCategoryCodesParams)+`]&size=${sizeParam}` : "/v1/distinctFieldData/productDetails/" + skuCodekey + "?filter=category[in]:["+encodeURIComponent(filterCategoryParams)+`]&size=${sizeParam}`;
            }
            const response = await ChannelkartNetworkGet(url);
            if(response.status===200){
                return {
                    data: response.data,
                    skuCodekey
                }
            }else{
                return {
                    data: [],
                    skuCodekey
                };
            }
        }else{
            const url = "/v1/query/productMetadata_sku_details";
            const response = await ChannelkartNetworkGet(url);
            if(response.status===200){
                if(selectedCategories){
                    const filteredSkuCodesAccordingCategory = response.data.features.filter((skuObj: productMetadataSkuObj) => {
                        return selectedCategories.includes(skuObj.category)
                    })
                    if(selectedSubCategoriesCodes && selectedSubCategoriesCodes.length>0){
                        const filteredSkuCodesAccordingCategorySubCategory = filteredSkuCodesAccordingCategory.filter((skuObj: productMetadataSkuObj) => {
                            return selectedSubCategoriesCodes.includes(skuObj.sub_category_code);
                        })
                        return {
                            data: filteredSkuCodesAccordingCategorySubCategory,
                            skuCodekey: "sku_code"
                        }
                    }else{
                        return {
                            data: filteredSkuCodesAccordingCategory,
                            skuCodekey: "sku_code"
                        }
                    }
                }else{
                    return {
                        data: response.data.features,
                        skuCodekey: "sku_code"
                    }
                }
            }else{
                return {
                    data: [],
                    skuCodekey: "sku_code"
                }
            }
        }
        
        
    }catch(err){
        return {
            data: [],
            skuCodekey
        };
    }
}
export function fetchAllBaskets(clientconfig: any[]){
    let basketObjArr = [];
    try{
        for(let i=0;i<clientconfig.length;i++){
            if(clientconfig[i].domainType === "order_basket_configuration"){
                for(let j=0;j<clientconfig[i].domainValues.length;i++){
                    if(clientconfig[i].domainValues[j].name === "orderBasketMapping"){
                        basketObjArr = clientconfig[i].domainValues[j].value;
                        return basketObjArr;
                    }
                }
            }
        }
        // if()
    }
    catch(err){
        return [];
    }
}

//manageBannerServices
export async function getAllBanners(){
    let url = "/v1/banner?sort=creationTime:desc&size=10000&source=portal&callType=scheduled&nativeQuery=true";
    try{
        const banners =  await ChannelkartNetworkGet(url);
        if(banners.status===200){
            return banners.data.features;
        }
        return []
    }catch(err){
        return [];
    }
    
}
export function getBannerStatusChangePayload(payload: bannerData){
    let data = _.pick(payload, ["bannerName", "extendedAttributes", "bannerDescription", "activeStatus", "bannerType", "bannerElements"]);
    data['activeStatus'] = (data['activeStatus'] === "active") ? "inactive" : "active";

    if (
        data.extendedAttributes &&
        data.extendedAttributes.distributionData
    ) {
        data.extendedAttributes.distributionData.activeStatus = data.activeStatus;

        if (!data.extendedAttributes.distributionData.district) {
            Reflect.deleteProperty(data.extendedAttributes.distributionData, 'district');
        }
        if (!data.extendedAttributes.distributionData.branch) {
            Reflect.deleteProperty(data.extendedAttributes.distributionData, 'branch');
        }
    }
    return data;
}
export async function changeStatusBannerDistribution(bannerPayload: bannerData, verifiedUser?: manageUpdateAccessObj,couponFilterConfig?: boolean){
    try{
        let url2 = "/v1/bannerDistribution" + (verifiedUser? `?verifiedBy=${verifiedUser.phoneNumber}` : "");
        const bannerDistibutionData = await makeBannerDistributionData(bannerPayload.extendedAttributes.distributionData,couponFilterConfig)
        const distributionResponse = await ChannelkartNetworkPost(url2, bannerDistibutionData ,{"Content-Type": "application/json"});
        return {message: "Banner status updated successfully", success: distributionResponse.status===201};
    }
    catch(err){
        return {message: "An Error Occured", success: false }
    }
}

export async function deleteBanner(bannerName: string, verifiedUser?: manageUpdateAccessObj) {
    let url = verifiedUser? encodeURI(`/v1/banner/${bannerName}?verifiedBy=${verifiedUser.phoneNumber}&nativeQuery=true`) : encodeURI(`/v1/banner/${bannerName}?nativeQuery=true`);
    try{
        const response = await ChannelkartNetworkDelete(url);
        if(response.status===200){
            return { message: `"${bannerName}" banner deleted successfully`, success: true}
        }else{
            return { message: "Something went wrong,Try again", success: false};
        }
    }catch(err){
        return { message: "An error occurred please try again", success: false};
    }
}

export async function getGlobalFilters(filterName:string, clientConfigRef?:any[]){
    try{
        const metaData = clientConfigRef ? clientConfigRef : (await ChannelkartNetworkGet("/metadata/clientconfig"));
        const globalFilterData = (metaData?.data?.features || metaData)?.find((feature:{domainType:string}) => feature.domainType === "global_filter_configuration");

        if(globalFilterData){
            const requiredFilterData = globalFilterData.domainValues?.find((filter:any)=>filter.name === filterName);
            return requiredFilterData?.value ?? [];
        }else{
            return [];
        }
    }catch(error){
        console.log(error)
        return [];
    }
}
export function getLocationParam(bannerFilters: any){
    try{
        const district = bannerFilters["district"];
        const branch = bannerFilters["branch"];
        let locationParam = district;
        if(branch){
            locationParam = branch + " > " + locationParam;
        }
        return locationParam;
    }catch(err){
        console.log(err);
        return "";
    }
}
export async function fetchProductFiltersOptions(urlParam: productParam,useSalesHubAPI?:boolean){
    try{
        let response;
        let finalOptions: string[] = [];
        if(useSalesHubAPI){
        response = await ChannelkartNetworkGet(`https://api.salescodeai.com/catalog/meta?type=${urlParam}&size=10000`, localStorage.getItem("auth_token") || defaultTokenNew);
        // finalOptions = response.data.map((option: any) => option.name);
        finalOptions = _.uniq(response.data.map((option: any) => option.name));
        }else{
        response = await ChannelkartNetworkGet(`/v1/distinctFieldData/productDetails/${urlParam}?size=${sizeParam}`);
        finalOptions = response.data.filter((option: productDetailsResponse) => typeof(option[urlParam]) === "string").map((option: productDetailsResponse) => {
            return option[urlParam];
        })
        }
        return finalOptions;
    }catch(err){
        console.log(err);
        return [];
    }
}
export async function fetchSchemesOptions(disableSchemeBanner?:boolean) {
    try {
        if(disableSchemeBanner) return [];
        const token = getToken() ?? "";
        const lob = localStorage.getItem("lob") ?? "";
        const env = localStorage.getItem("env") ?? "";
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'lob': lob,  
            // 'env': env, 
            'Authorization': token
        };

        let allPromoIds: string[] = [];
        let page = 0;
        const size = 500;

        while (true) {
            const response = await fetch(`https://promos-${env}.salescode.ai/api/v1/promos/fetch/allPromos?active=true&page=${page}&size=${size}`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const responseData = await response.json();
            const currentData = responseData.data.content;

            if (!currentData || currentData.length === 0) {
                break; // No more data
            }

            const ids = currentData.map((item: any) => item.promo_id);
            allPromoIds.push(...ids);
            page++;
        }

        return allPromoIds;
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function fetchNewSchemesOptions(disableSchemeBanner?: boolean) {
    try {
        if (disableSchemeBanner) return [];

        const size = 500;
        let page = 0;
        let allPromoIds: string[] = [];

        while (true) {
            const url = `https://api.salescodeai.com/promotions?page=${page}&size=${size}`;

            const response = await ChannelkartNetworkGet(url, localStorage.getItem("auth_token") || defaultTokenNew);

            if (response.status !== 200) {
                break;
            }

            const currentData = response.data;
            if (!currentData || currentData.length === 0) {
                break; // No more data
            }

            const ids = currentData.map((item: any) => item.code);
            allPromoIds.push(...ids);

            if (currentData.length < size) {
                break;
            }

            page++;
        }

        return allPromoIds;

    } catch (err) {
        console.error(err);
        return [];
    }
}
// export async function fetchSchemesOptions(disableSchemeBanner?:boolean){
//     try{
//         if(disableSchemeBanner) return [];
//         const response = await ChannelkartNetworkGet(`/v1/query/getDistinctSchemeIds`);
//         const ids = response.data.features.map((item:any) => item.id);
//         return ids;
//     }catch(err){
//         console.log(err);
//     }
// }
export async function fetchBannerProductFilterData(productFilterData:productFilterOption[],selectedFilterOptions:{[key in productParam]?:string[]}){

    const updatedProductFilterData= productFilterData.map(async(filterObject: productFilterOption)=>{
        let filter:string = "";
        Object.keys(selectedFilterOptions).forEach((key)=>{
            if(key!==filterObject.id && selectedFilterOptions[key as productParam]?.length){
                filter =  (filter ? filter + " and " : "?filter=") + key + "[in]:[" + selectedFilterOptions[key as productParam] + ']'
            }
        })
        const tempUrl = "/v1/distinctFieldData/productDetails/" +  filterObject.id + filter;
        let url = tempUrl.replace("&","%26");
        url += (tempUrl.includes("?filter") ? `&size=${sizeParam}`: `?size=${sizeParam}`);
        try{
            const response = await ChannelkartNetworkGet(url);
            const options = response.data.filter((filterResponse: any) => filterResponse[filterObject.id] ).map((filterResponse:any)=>filterResponse[filterObject.id]);
            return {...filterObject, options}
        }catch(error){
            console.log(error);
            return {...filterObject, options:[]};
        }
    });
    return Promise.all(updatedProductFilterData);
}
export async function fetchFilteredSkuOptions(selectedFilterOptions:{[key in productParam]?:string[]},skuParam: string){
    try{
        if(skuParam!=="productMetaDataSku"){
            let filter: string = "";
            Object.keys(selectedFilterOptions).forEach((key)=>{
                if(selectedFilterOptions[key as productParam]?.length){
                    filter =  (filter ? filter + " and " : "?filter=") + key + "[in]:[" + selectedFilterOptions[key as productParam] + ']'
                }
            })
            const tempUrl = "/v1/distinctFieldData/productDetails/" +  skuParam + filter;
            let url = tempUrl.replace("&","%26");
            url += (tempUrl.includes("?filter") ? `&size=${sizeParam}`: `?size=${sizeParam}`);
            const response = await ChannelkartNetworkGet(url);
            const options = response.data.map((skuResponse: any) => skuResponse[skuParam]);
            return options;
        }else{
            const url = "/v1/query/productMetadata_sku_details";
            const response = await ChannelkartNetworkGet(url);
            if(response.status===200){
                const SKUcodesResponse = response.data.features;
                const filteredSKUs = SKUcodesResponse.filter((sku: any) => {
                    return Object.keys(selectedFilterOptions).every((filterKey: string) => {
                      const selectedValues = selectedFilterOptions[filterKey as productParam];
                      const skuValue = sku[filterKey];
                      return !selectedValues || selectedValues.length === 0 || selectedValues.includes(skuValue);
                    });
                  });
                const skuCodes = filteredSKUs.map((option: any) => option["sku_code"]);
                return skuCodes;
            }else{
                throw new Error();
            }
        }
        
    }catch(error){
        console.log(error);
        throw new Error();
    }
}
export function getConfigFromClientConfig(clientconfig: any[], configName: string){
    return clientconfig?.find((config) => config.domainType === configName)?.domainValues;
}
export function getFinalBannerTemplates(clientConfig: any[]){
    try{
        const bannerConfig = getConfigFromClientConfig(clientConfig,'banner_configuration')?.find((configObj: configurationAttributeType) => configObj.name === "bannerConfiguration")?.value;
        let finalBannerTemplates: BannerTemplate[] = [];
        const configBannerTemplateOptions = bannerConfig?.find((option: { name: string} ) => {
            return option.name === "bannerTemplatesConfig"
        })?.value as BannerTemplate[];
        if(!configBannerTemplateOptions){
            finalBannerTemplates = bannerTemplates
        }else{
            for(let configBannerTemplate of configBannerTemplateOptions){
                const bannerTemplateObj = bannerTemplates.find((template) => template.id === configBannerTemplate?.id);
                if(bannerTemplateObj){
                    let newBannerOptions = configBannerTemplate.options;
                    if(!newBannerOptions){
                        newBannerOptions = bannerTemplateObj.options
                    }else{
                        newBannerOptions = newBannerOptions.filter((optionObj) => bannerTemplateObj.options.find((templateObj) => templateObj.id === optionObj.id));
                    }
                    finalBannerTemplates.push({
                        ...bannerTemplateObj,
                        ...configBannerTemplate,
                        options: newBannerOptions
                    })
                }
            }
        }
        return finalBannerTemplates;
    }catch(err){
        return bannerTemplates;
    }
}
export function validateBannerResponse(bannerResp: any){
    const respObj = bannerResp?.data?.features?.[0];
    if(respObj){
        const respKeys = Object.keys(respObj);
        for(let respKey of respKeys){
            if(respObj[respKey]){
                if(respKey === "metaDataResponse"){
                    const validationObj = validateMetaDataResponse(respObj[respKey]);
                    if(!validationObj.success) return validationObj;
                }
                else if(respObj[respKey]?.status?.toLowerCase()!=="success"){
                    const message =  respObj[respKey]?.validation?.violations?.[0]?.message ?? "Something went wrong while submitting the banner data";
                    return { success: false, message };
                } 
            }
        }
        return { success: true, message: "Banner data submitted successfuly"}
    }else{
        return { success: false, message: "Something went wrong"}
    }
}
export async function getBannerStatus(bannerName:string){
    let url = `/v1/query/fetchBannerDistributionListForBanner?bannerName=${bannerName}&page=0&size=5`;
    try{
        const response = await ChannelkartNetworkGet(url);
        if(response.status===200){
            return response.data.features;
        }else{
            return [];
        }
        
    }catch(err){
        return [];
    }
}
export async function retryBannerDistribution(bannerPayload: any){
    try{
        let url2 = "/v1/bannerDistribution";
        const distributionResponse = await ChannelkartNetworkPost(url2, bannerPayload ,{"Content-Type": "application/json"});
        return {message: "Banner updated successfully", success: distributionResponse.status===201 };
    }catch(err){
        return {message: "An Error Occured while updating banner distribution", success: false }
    }

}