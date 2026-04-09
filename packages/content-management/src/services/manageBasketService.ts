import { basketRequestBody } from "@/features/content-management/basket/manage/ManageBasketTypes";
import { getNewMetaDataConfig, manageUpdateAccessObj } from "@/utils/UtilityService";
import { ChannelkartNetworkGet, ChannelkartNetworkPost } from "@/utils/networkServiceSimple";

export async function getAllBasket(){
    try {
        const clientConfig = await getNewMetaDataConfig();
        // const response = await ChannelkartNetworkGet('/metadata/clientconfig');
        console.log("clientConfig",clientConfig)
        return clientConfig;
    } catch (error) {
        return error;
    }  
}

export async function getMultipleBlob(formData: FormData) {
    try {
      
      const response = await ChannelkartNetworkPost(
        "/v1/uploadMultipleFiles/images",
        formData,
        { "Content-Type": "multipart/form-data" }
      );
      return response;
    } catch (error) {
      return error;
    }
  }


export async function getSecondaryFeatures(){
  try{
    const response = await ChannelkartNetworkGet("/v1/distinctFieldData/secondaryProduct/feature");
    if(response?.data){
      return response.data.map((feature:any)=>feature.feature).filter(Boolean);
    }else{
      return [];
    }
  }catch(error){
    console.log(error);
    return [];
  }
}