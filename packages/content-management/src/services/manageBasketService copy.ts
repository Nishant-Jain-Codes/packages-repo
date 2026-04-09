import { basketRequestBody } from "@/features/content-management/basket/manage/ManageBasketTypes";
import { manageUpdateAccessObj } from "@/utils/UtilityService";
import { ChannelkartNetworkGet, ChannelkartNetworkPost } from "@/utils/networkServiceSimple";

export async function getAllBasket(){
    try {
        const response = await ChannelkartNetworkGet('/metadata/clientconfig');
        return response;
    } catch (error) {
        return error;
    }  
}

// export async function  updateBasket(configName:string,requestBody:basketRequestBody,verifiedUser?: manageUpdateAccessObj){
//     try {
//       const url = verifiedUser? `/metadata/clientconfig?name=${configName}&verifiedBy=${verifiedUser.phoneNumber}` : `/metadata/clientconfig?name=${configName}`;
//       const response = await ChannelkartNetworkPut(url,requestBody);
//         return response;
//     } catch (error) {
//         return error;
//     }
// }

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