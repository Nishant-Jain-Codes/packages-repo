import cloneDeep from "lodash.clonedeep";
import { BlockObjType, retailerAppLayoutConfigObj } from "@/features/content-management/block/create/CreateBlockTypes";
import { defaultBlockConfig, getNewMetaDataConfig, manageUpdateAccessObj } from "@/utils/UtilityService";
import { openPopup } from "@/stateManagement/actions/popupActions";
import { configurationAttributeType } from "@/types";
import { getLob } from "@/utils/UtilityService";

export async function fetchClientConfig(){
    // Old metadata-based flow (deprecated for clientConfig):
    // const url = '/metadata/clientconfig';
    // const response = await ChannelkartNetworkGet(url);
    // return response.data.features;

    try {
        const clientConfig = await getNewMetaDataConfig();
        return clientConfig;
    } catch (err) {
        console.log(err);
        return [];
    }
}
// export async function updateBlockConfig(requestBody:any,configName: string){
//     try {
//         const response = await ChannelkartNetworkPut(`/metadata/clientconfig?name=${configName}`,requestBody);
//         return response;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }
export function getClientConfigDomainType(clientconfig: any[],domainType: string){
    return clientconfig?.find((configObj: any) => configObj.domainType === domainType)?.domainValues;
}
export function getConfigKeyValue(config: configurationAttributeType[], keyName: string) {
    return config?.find((configObj: configurationAttributeType) => configObj.name === keyName)?.value;
}
export function getUpdatedRoleAppLayoutConfig(roleAppLayoutConfig: configurationAttributeType[], targetBlock: any, innerComponentId: string) {
    const configKeyValue = "homeScreenBlockWidget";
    const blockConfigIndex = roleAppLayoutConfig?.findIndex((configObj) => configObj.name === configKeyValue);
    const newRoleLayoutConfig = cloneDeep(roleAppLayoutConfig);
    if(blockConfigIndex!==-1){
        
        const allBlocks = roleAppLayoutConfig[blockConfigIndex].value ?? [];
        const updatedBlocks = getUpdatedBlocks(allBlocks,targetBlock,innerComponentId);
        newRoleLayoutConfig[blockConfigIndex].value = updatedBlocks;
    }
    return newRoleLayoutConfig;
}
export function getUpdatedBlocks(allBlocks: any[],targetBlock: any,innerComponentId: string){
    let newAllBlocks = [...allBlocks];
    const curBlockIndex = allBlocks.findIndex((block:any) => {
        return block.id === targetBlock.id;
    })
    if(targetBlock?.type){
        switch(targetBlock.type){
            case "Banner": {
                newAllBlocks = newAllBlocks.map((blockObj) => {
                    if(blockObj?.type === "Banner"){
                        if(targetBlock.id !== blockObj.id){
                            return {
                                ...blockObj,
                                bannerIds: blockObj?.bannerIds.filter((id: string) => id!==innerComponentId)
                            }
                        }else{ //if(targetBlock.id === blockObj.id)
                            return {
                                ...blockObj,
                                bannerIds: [...blockObj.bannerIds,innerComponentId]
                            }
                        }  
                    }
                    else if (blockObj?.type === "PromoBlock" && blockObj.bannerIds?.includes(innerComponentId)) {
                        return {
                            ...blockObj,
                            bannerIds: blockObj.bannerIds.filter((id: string) => id !== innerComponentId)
                        };
                    } 
                    else{
                        return blockObj;
                    }
                })
                break;
            }
            case "Bucket": {
                newAllBlocks = newAllBlocks.map((blockObj) => {
                    if(blockObj.type ==="Bucket"){
                        if(targetBlock.id !== blockObj.id){
                            const newBlockObj = {...blockObj};
                            if(blockObj.bucketId === innerComponentId) Reflect.deleteProperty(newBlockObj, 'bucketId'); //unmapping previously linked block of bucket
                            return newBlockObj;
                        }else{  //if(targetBlock.id === blockObj.id)
                            return {
                                ...blockObj,
                                bucketId: innerComponentId
                            }
                        }
                    }
                    else{
                        return blockObj;
                    }
                })
                break;
            }
            case "Basket": {
                newAllBlocks = newAllBlocks.map((blockObj) => {
                    if(blockObj.type ==="Basket"){
                        if(targetBlock.id !== blockObj.id){
                            const newBlockObj = {...blockObj};
                            if(blockObj.basketId === innerComponentId) Reflect.deleteProperty(newBlockObj, 'basketId'); //unmapping previously linked block of basket
                            return newBlockObj;
                        }else{  //if(targetBlock.id === blockObj.id)
                            return {
                                ...blockObj,
                                basketId: innerComponentId
                            }
                        }
                    }
                    else{
                        return blockObj;
                    }
                })
                break;
            }
            case "PromoBlock": {
                newAllBlocks = newAllBlocks.map((blockObj) => {
                    if (blockObj?.type === "PromoBlock") {
                        if (targetBlock.id !== blockObj.id) {
                            return {
                                ...blockObj,
                                bannerIds: blockObj?.bannerIds
                                    ? blockObj.bannerIds.filter((id: string) => id !== innerComponentId)
                                    : []
                            };
                        } else {
                            return {
                                ...blockObj,
                                bannerIds: blockObj.bannerIds
                                    ? [...blockObj.bannerIds, innerComponentId]
                                    : [innerComponentId]
                            };
                        }
                    } else if (blockObj?.type === "Banner" && blockObj.bannerIds?.includes(innerComponentId)) {
                        return {
                            ...blockObj,
                            bannerIds: blockObj.bannerIds.filter((id: string) => id !== innerComponentId)
                        };
                    } else {
                        return blockObj;
                    }
                });
                break;
            }
            default: {
                break;
            }
        }
    }
    return newAllBlocks;
}
// export async function updateRoleAppLayoutConfiguration(role: string, roleAppLayoutConfig: configurationAttributeType<any[]>[],verifiedUser?: manageUpdateAccessObj){
//     const configName = `${role}_app_layout_configuration`;
//     const response = await updateConfiguration(configName,roleAppLayoutConfig,verifiedUser);
//     if(response.status === 200 || response.status === 201){
//         return response;
//     }else{
//         throw new Error(`Error occured while updating ${configName}`);
//     }
// }
export function getAvailableBlockOptionsOfType(blockType:"Banner" | "Bucket" | "Basket" ,allBlocks: BlockObjType[],blockTypeId?: string){
    switch(blockType){
        case "Banner": {
            return allBlocks.filter((blockObj) => blockObj.type==="Banner" && blockObj.bannerType === blockTypeId);
        }
        case "Bucket": {
            return allBlocks.filter((blockObj) => blockObj.type==="Bucket" && blockObj.bucketDesign === blockTypeId  && (!blockObj.bucketId)) // not linked
        }
        case "Basket": {
            return allBlocks.filter((blockObj) => blockObj.type==="Basket" && !blockObj.basketId);
        }
    }
}
export function getAvailableBlockOptionsOfTypeNew(blockType:"Banner" | "Bucket" | "Basket" ,allBlocks: BlockObjType[],blockTypeId?: string){
    
    switch(blockType){
    //     case "Banner": {
    //         return allBlocks.filter((blockObj) => 
    //     (blockObj.type === "Banner" && blockObj.bannerType === blockTypeId) ||
    //     (blockObj.type === "PromoBlock" && blockTypeId === "1024 X 376")
    //   );
    //     }
        case "Banner": {
            if(blockTypeId==="Auto Play Video"){
                blockTypeId="tvAdds"
            }
            else if(blockTypeId==="Toggle Banner"){
                blockTypeId="toggleBanner"
            }
            return allBlocks.filter(
              (blockObj) =>
                (blockObj.type === "Banner" && blockObj.bannerType === blockTypeId) ||
                (blockObj.type === "PromoBlock" &&
                  blockTypeId === "1024 X 376" &&
                  blockObj.bannerVersion !== undefined) // Filter only if bannerVersion exists
            );
          }
        case "Bucket": {
            return allBlocks.filter((blockObj) => blockObj.type==="Bucket" && blockObj.bucketDesign === blockTypeId  && (!blockObj.bucketId)) // not linked
        }
        case "Basket": {
            return allBlocks.filter((blockObj) => blockObj.type==="Basket" && !blockObj.basketId);
        }
    }
}
export function getLinkedBlock(allBlocks: any[],blockType: "Banner" | "Bucket" | "Basket",innerComponentId: string){
    switch(blockType){
        case "Banner": {
            const linkedBlock = allBlocks.find((blockObj) => {
                return blockObj.bannerIds?.includes(innerComponentId);
            });
            return linkedBlock;
        }
        default: { // handle for Bucket and Basket
            const linkedBlock = allBlocks.find((blockObj) => {
                const idKey = blockType.toLowerCase() + "Id";
                return blockObj[idKey] === innerComponentId;
            })
            return linkedBlock;
        }
    }
}
export async function updateSelectedBlockData(role:string,curInnerComponentId: string,selectedBlock: BlockObjType,clientConfig: any[],verifiedUser?: manageUpdateAccessObj){
    try{
        // const role = "retailer";
        const configName = `${role}_app_layout_configuration`;
        const roleAppLayoutConfig = getClientConfigDomainType(clientConfig,configName);
        const updatedRoleLayoutConfig = getUpdatedRoleAppLayoutConfig(roleAppLayoutConfig,selectedBlock,curInnerComponentId);
        // const response = await updateRoleAppLayoutConfiguration(role,updatedRoleLayoutConfig,verifiedUser);
        const response2 = await updateWholeSellerConfiguration(clientConfig,updatedRoleLayoutConfig,verifiedUser);
        
        return true;
    }
    catch(err){
        openPopup("Error",`Something went wrong while linking ${selectedBlock.type} with block`);
        return false;
    }
  }
export function getBlockMetaData(role:string,curInnerComponentId: string,selectedBlock: BlockObjType,clientConfig: any[],verifiedUser?: manageUpdateAccessObj){
    try{
        
        // const role = "retailer";
        const configName = `${role}_app_layout_configuration`;
        const roleAppLayoutConfig = getClientConfigDomainType(clientConfig,configName);
        let betaConfig = clientConfig.find((config: any) => {
            return config.domainType === "beta_configuration";
        })?.domainValues;
        const betaBlocks = betaConfig?.find((configObj: retailerAppLayoutConfigObj) => {
            return configObj.name === "homeScreenBlockWidget";
        })?.value ?? [];
        let useBeta = false;
        if (Array.isArray(betaBlocks) && betaBlocks.length > 0) {
             
            useBeta = true;
        }
        const updatedRoleLayoutConfig = getUpdatedRoleAppLayoutConfig(roleAppLayoutConfig,selectedBlock,curInnerComponentId);
        const updatedBetaConfig = getUpdatedRoleAppLayoutConfig(betaConfig ?? [],selectedBlock,curInnerComponentId);
        const metaDataBlockObj = {
            domainName: "clientconfig",
            domainType: configName,
            domainValues: updatedRoleLayoutConfig,
            lob: getLob(),
        }; 
        const metaDataBetaObj = {
            domainName: "clientconfig",
            domainType: "beta_configuration",
            domainValues: updatedBetaConfig,
            lob: getLob(),
        }; 

        return useBeta ? metaDataBetaObj : metaDataBlockObj;
    }
    catch(err){
        openPopup("Error",`Something went wrong while linking ${selectedBlock.type} with block`);
        return false;  //will look
    }
  }

  export async function updateWholeSellerConfiguration(clientConfig: any[],updatedRetailerAppLayout: any[],verifiedUser?: manageUpdateAccessObj){
    try{
        const wholeSellerLayoutConfig = getClientConfigDomainType(clientConfig,"wholesaler_app_layout_configuration");
        if(wholeSellerLayoutConfig){
            const configKeyValue = "homeScreenBlockWidget";
            const blockConfig = updatedRetailerAppLayout?.find((configObj) => configObj.name === configKeyValue);
            const updatedWholeSellerLayoutConfig = cloneDeep(wholeSellerLayoutConfig);
            const wholeSellerBlockConfigIndex = wholeSellerLayoutConfig.findIndex((configObj: configurationAttributeType) => configObj.name === configKeyValue);
            if(blockConfig){
                const allBlocks = blockConfig?.value ?? [];
                // const updatedBlocks = getUpdatedBlocks(allBlocks,targetBlock,innerComponentId);
                if(wholeSellerBlockConfigIndex!==-1){
                    updatedWholeSellerLayoutConfig[wholeSellerBlockConfigIndex].value = allBlocks;
                }else{
                    const blockConfigObj = {...defaultBlockConfig[0]};
                    blockConfigObj.value = allBlocks;
                    updatedWholeSellerLayoutConfig.push(blockConfigObj);
                }
                // const response = await updateRoleAppLayoutConfiguration("wholesaler",updatedWholeSellerLayoutConfig,verifiedUser);
            }
        }
        return true;
    }catch(err){
        throw new Error();
    }
    
  }
  export async function getWholeSellerConfiguration(clientConfig: any[],updatedRetailerAppLayout: any[]){
    try{
        const wholeSellerLayoutConfig = getClientConfigDomainType(clientConfig,"wholesaler_app_layout_configuration");
        const configKeyValue = "homeScreenBlockWidget";
        const blockConfig = updatedRetailerAppLayout?.find((configObj) => configObj.name === configKeyValue);
        const updatedWholeSellerLayoutConfig = cloneDeep(wholeSellerLayoutConfig);
        const wholeSellerBlockConfigIndex = wholeSellerLayoutConfig.findIndex((configObj: configurationAttributeType) => configObj.name === configKeyValue);
        if(blockConfig){
            const allBlocks = blockConfig?.value ?? [];
            if(wholeSellerBlockConfigIndex!==-1){
                updatedWholeSellerLayoutConfig[wholeSellerBlockConfigIndex].value = allBlocks;
            }else{
                const blockConfigObj = {...defaultBlockConfig[0]};
                blockConfigObj.value = allBlocks;
                updatedWholeSellerLayoutConfig.push(blockConfigObj);
            }
            const metaDataBlockObj = {
                domainName: "clientconfig",
                domainType: "wholesaler_app_layout_configuration",
                domainValues: updatedWholeSellerLayoutConfig,
                lob: getLob(),
            }; 
            return metaDataBlockObj;
        }
    }catch(err){
        throw new Error();
    }
    
  }