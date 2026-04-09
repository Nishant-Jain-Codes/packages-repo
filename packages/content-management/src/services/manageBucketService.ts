import { bucketType, bucketTypeOption } from "@/features/content-management/bucket/create/CreateBucketTypes";
import { manageUpdateAccessObj, getNewMetaDataConfig } from "@/utils/UtilityService";
import { ChannelkartNetworkGet, defaultTokenNew, tokenNew } from "@/utils/networkServiceSimple";
const sizeParam = 10000;


export async function fetchAllBuckets(){
    try{
        const clientConfig = await getNewMetaDataConfig();
        const bucketConfig = clientConfig.find((Obj: { domainType: string }) => {
            return Obj.domainType === 'bucket_configuration'
        })
        return bucketConfig?.domainValues;
        
    }catch(err){
        console.log(err);
    }
    
}

// export async function updateBucketConfig(requestBody:any,configName: string,verifiedUser?: manageUpdateAccessObj){
//     try {
//         const url = verifiedUser? `/metadata/clientconfig?name=${configName}&verifiedBy=${verifiedUser.phoneNumber}` : `/metadata/clientconfig?name=${configName}`
//         const response = await ChannelkartNetworkPut(url,requestBody);
//         return response;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }
export async function fetchCompany(
  urlParam: bucketType,
): Promise<string[]> {
  try {
    let page = 0;
    let size = 500;
    let hasMore = true;
    const allSources: string[] = [];
    while (hasMore) {
      const response = await ChannelkartNetworkGet(
        `/outletDetails?transformerout=outlet_location_transformer&page=${page}&size=${size}`
      );
      const features = response?.data?.features || [];
      const sources = features
        .map((feature: any) => feature.source)
        .filter((source: any): source is string => typeof source === "string");
      allSources.push(...sources);
      if (features.length < size) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return Array.from(new Set(allSources));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchBucketTypeAllOptions(urlParam: bucketType,useSaleshub?:boolean){
    try{
        let response;
        let finalOptions;
        if(useSaleshub){
          if(urlParam==="ctg"){
            urlParam = "group" as bucketType;
          }
          response = await ChannelkartNetworkGet(`https://api.salescodeai.com/catalog/meta?type=${urlParam}&size=${sizeParam}`,localStorage.getItem("auth_token") || defaultTokenNew);
          finalOptions = response.data.map(
            (option: bucketTypeOption) => option.name
          );
        }else{
          response = await ChannelkartNetworkGet(`/v1/distinctFieldData/productDetails/${urlParam}?size=${sizeParam}`);
          finalOptions = response.data.filter((option: bucketTypeOption) => typeof(option[urlParam]) === "string").map((option: bucketTypeOption) => {
            return option[urlParam];
        })
        }       
        return Array.from(new Set<string>(finalOptions));
    }catch(err){
        console.log(err);
        return [];
    }
}
export async function getGridOptionMapping(primaryType:string,secondaryType:string,primaryOptions:string[],useSaleshub?:boolean){
    try{
        const primaryProp: bucketType = getUrlParam(primaryType);
        const secondaryProp: bucketType = getUrlParam(secondaryType);
    //  if (primaryType.toLowerCase() === "company") {
    //   const companyPromises = primaryOptions.map(async (company) => {
    //     const response = await ChannelkartNetworkGet(
    //       `/productmetadata/v1/items/pricing?outletCode=${company}outlet&size=500`
    //     );
    //     const products = response.data.features || [];

    //     const secondaryOptions = Array.from(
    //       new Set(
    //         products
    //           .map((product: any) => product?.extendedAttributes?.[secondaryProp])
    //           .filter((value: any): value is string => typeof value === "string")
    //       )
    //     ) as string[];

    //     return {
    //       name: company,
    //       secondaryOptions,
    //     };
    //   });
    //   const gridOptionMapping = await Promise.all(companyPromises);
    //   return gridOptionMapping; 
    // }
        let response: any = {};
        if(useSaleshub){
          response = await ChannelkartNetworkGet(`https://api.salescodeai.com/products?limit=${sizeParam}`,localStorage.getItem("auth_token") || defaultTokenNew);
        }else{
          response = await ChannelkartNetworkGet(`/products?size=${sizeParam}`);
        }
        const allProducts = response.data.features ?? response.data;
        const tempGridOptionMapping = primaryOptions?.map((option: string) => {
            return {
                name: option,
                secondaryOptions: allProducts?.filter((product: any) => {
                    return product[primaryProp]?.toLowerCase() === option?.toLowerCase() && product[secondaryProp];
                }).map((product: any) => product[secondaryProp])
            }
        });
        const gridOptionMapping = tempGridOptionMapping?.map((product) => {
            return {
                name: product.name,
                secondaryOptions: Array.from(new Set(product.secondaryOptions)) as string[]
            }
        })
        return gridOptionMapping;
    }catch(err){
        console.log(err);
        return [];
    }
}
// export function getUrlParam(bucketType: string){
//     return bucketType==="Pack Size"? "pieceSize" : (bucketType==="Smart Buy"? "smartBuy" : bucketType.toLowerCase()) as bucketType;
// }
  export function getUrlParam(bucketType: string) {
    return bucketType === "Pack Size"
      ? "pieceSize"
      : bucketType === "Smart Buy"
      ? "smartBuy"
      : bucketType === "Sub Category"
      ? "subCategory"
      : bucketType === "Sub Brand"
      ? "subBrand"
      : bucketType === "Piece Size Description"
      ? "pieceSizeDesc"
      : bucketType === "Brand Code"
      ? "brandCode"
      : bucketType === "Company"
      ? "tenantId"
      : (bucketType.toLowerCase() as bucketType);
  }
export async function fetchBucketSubTypeOptions(primaryType: string, secondaryType: string, primaryItem: string){
    try{
        const  urlParam1: bucketType = getUrlParam(primaryType);
        const  urlParam2: bucketType = getUrlParam(secondaryType);


        const response = await ChannelkartNetworkGet(`/v1/distinctFieldData/productDetails/${urlParam2}?filter=${urlParam1}:${primaryItem}&size=${sizeParam}`);
        const finalOptions = response.data.filter((option: bucketTypeOption) => typeof(option[urlParam2]) === "string").map((option: bucketTypeOption) => {
            return option[urlParam2];
        })
        return finalOptions;
    }catch(err){
        console.log(err);
        return [];
    }
}