import { bannerData, bannerPayload, bannerReduxState } from "@/features/content-management/banner/create/bannerTypes";
import { Action } from "@/utils/roleReducer";

const initialState:bannerReduxState | null = null;
export function bannerReducer(state: bannerReduxState | null = initialState, action: Action<bannerPayload>): bannerReduxState | null{
    switch(action.type){
        case "setCurrentBanner": {
            if(action.payload?.bannerState){
                return {
                    bannerData: {...action.payload.bannerState}
                }
            }else{
                return state;
            }
        }
        case "resetBanner": {
            return null;
        }
        case "setBannerUpdateStatus": {
            return {
                ...state,
                ...action.payload 
            } as bannerReduxState
        }
        default: {
            return state;
        }
    }
}