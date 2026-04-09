import { bannerData, store } from "@/utils/UtilityService";

export function setCurrentBanner(bannerState: bannerData){
    store.dispatch({
        type: "setCurrentBanner",
        payload: {
            bannerState
        }
    })
}
export function resetBanner(){
    store.dispatch({
        type: "resetBanner",
        payload: {}
    })
}
export function setBannerUpdateStatus(isUpdated: boolean){
    store.dispatch({
        type: "setBannerUpdateStatus",
        payload: { isUpdated }
    })
}