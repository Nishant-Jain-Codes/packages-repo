import { popupType } from "@/types";
import { viewType } from "@/features/content-management/bucket/create/CreateBucketTypes";
import { blockInnerComponent } from "@/features/content-management/banner/create/bannerTypes";

export type basketDoaminType ={
  name: string;
  type: string;
  value: valueType[];
  docUrl: string;
  description: string;
  defaultValue: null;
  possibleVals: never[];
}
export type AppliesOnOption = {
  id: string;
  label: string;
  apiUrl: string;
  fieldKey: string;
};
export type valueType = {
  id?: string;
  template?: string;
  tag?: string;
  type?: string;
  title?: string;
  tagColor?: string;
  subtitle?: string;
  status?:string;
  backgroundImageBlobKey?:string,
  displayImageBlobKey?:string,
  basketTitleIconBlobKey?:string
  backGroundColor?:string,
  titleColor?:string,
  subTitleColor?:string
  addToCart?: boolean
  appliesOn?: string
  sbuName?: string
  allProductsBarColor?: string
  allProductsTextColor?: string
  [key: string]: any;
}

export type blobArrayType ={
    backgroundImageBlobKey?: string,
    displayImageBlobKey?:string,
    basketTitleIconBlobKey?:string
}

export type imageBlobs = {
    blobUrl: string,
    fileName: string,
    identifier: string,
} 

export type navigateType= {
    domainValues : basketDoaminType[];
    row: valueType;
    blockData?:any
}

export type imgType={
    fileName : string,
    blob : string,
}

export type blobResponse = {
    headers: Record<string, string>;
    body: string;
    statusCode: string;
    statusCodeValue: number;
  }

 export type UploadImageType ={
    label:string,
    imageState: imageStateType
    defaultImage?: string
    editRequest : editRequestType
    setCheck : React.Dispatch<React.SetStateAction<boolean>>
    openPopUp:(message: string, modalType: popupType) => void
    blobName : string
    error : boolean
    resolution : resolutionType
}

export type resolutionType = {
  height : Number,
  width : Number
}

export type imageStateType = {
  imageFile : File | null
  setImageFile : React.Dispatch<React.SetStateAction<File | null>>
}

export type basketRequestBody = {
  domainName: string;
  domainType: string;
  domainValues: basketDoaminType[] | null;
  lob: string;
}

export type editRequestType = {
  editRequestBody : valueType
  setEditRequestBody : React.Dispatch<React.SetStateAction<valueType>>
}
export interface CreateBasketProps{
  parentType?: "bucket" | "block",
  parentView?: viewType, //parentComponent View
  parentId?: string, 
  handleParentDataSubmit?: (innerComponent: blockInnerComponent) => Promise<void>,
  validateAllParentInputs?: () => string
}