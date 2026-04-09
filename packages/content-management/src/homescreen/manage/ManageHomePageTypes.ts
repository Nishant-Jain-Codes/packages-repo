import { popupType } from "@/types";

export type manageBlockAction = "delete" | "update" | "activeStatusChange";
export interface blockNavigateState {
    blocks: any[],
    blockConfiguration: any,
    currentBlock: any
}
export interface blockStateType {
    id: string,
    type: string,
    name: string,
}
export interface blockInnerComponent {
    bucketId?: string,
    basketId?: string,
    bannerId?: string,
    id?: string
}
export interface DragDropTableProps{
    data: any[],
    setData: React.Dispatch<React.SetStateAction<any[]>>,
    setConfirmPopupMessage: React.Dispatch<React.SetStateAction<string>>,
    setOpenConfirmPopup: React.Dispatch<React.SetStateAction<boolean>>,
    setCurrentBlockData: React.Dispatch<any>,
    setBlockAction: React.Dispatch<React.SetStateAction<manageBlockAction>>,
    blockConfiguration: any,
    basketConfiguration: any,
    bucketConfiguration: any,
    setShowLoader: React.Dispatch<React.SetStateAction<boolean>>,
    setPopupAction: React.Dispatch<React.SetStateAction<popupType>>,
    setGenericModalMessage: React.Dispatch<React.SetStateAction<string>>
    setOpenGenericModal: React.Dispatch<React.SetStateAction<boolean>>
}
export interface ManageHomeScreenProps{
    hidePreview?: boolean;
    hideBackButton?: boolean;
}
export interface OptionType {
    id: string;
    label: string;
  }
export interface AppOptionType {
    id: string;
    label: string;
    designations:OptionType[]
  }