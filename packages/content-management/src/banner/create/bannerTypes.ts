import { ChangeEvent } from "react";
import { BannerTemplate, languageOptions } from "@/utils/UtilityService";
import { bucketInnerComponent, viewType } from "@/features/content-management/bucket/create/CreateBucketTypes";
import { AutocompleteRenderInputParams } from "@mui/material";
import { fileExtensions, fileTypes } from "@/components/genericFileUpload/genericFileUploadTypes";


export interface blockInnerComponent {
    bucketId?: string,
    basketId?: string,
    bannerId?: string,
    id?: string
}

export type bannerDescriptionKeys = "bannerName" | "bannerDescription"

export type bannerDescriptionState = {
    [key in bannerDescriptionKeys]?: string;
};

export type productParam = "category" | "subCategoryCode" | "brand" | "pieceSize" | "schemeId";
export type bannerElementExtendedAttributes = {
    languageCode?: string;
    bannerPriority?: string;
}
export type bannerElementState = { [key in Exclude<productParam, "category">]?: string[]; } & {
    bannerType?: string;
    mediaName?: string;
    toggleBlobKey ?: string;
    blobKey?: string;
    additionalBlobKey?: string,
    inputRef?: HTMLInputElement | null;
    fileName?: string;
    fileType?: string;
    additionalInputRef?: HTMLInputElement | null;
    additionalFileType?: string;
    additionalFileName?: string;
    mediaUrl?: string;
    elementTitle?: string;
    elementDescription?: string;
    category?: string | string[];
    selectedCategories?: string[];
    selectedSubCategoriesCodes?: string[];
    selectedSKUcodes?: string[];
    elementComponents?: string | categoryElementComponents;
    elementNumber?: string;
    basket?: string;
    extendedAttributes?: null | bannerElementExtendedAttributes;
    bannerPriority?: string;
    redirection?: string;
    id?:string;
    additionalTogglePosition?: string;
} 
export interface bannerTemplateOptionConfigProps {
    elementState: bannerElementState,
    elemNumber: number,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    bannerTemplateType: BannerTemplate | null,
    checkErrors: boolean,
    categories: string[],
    baskets?: string[],
    languageCode: string,
    isEdit?:any
}

export interface imageInputsProps {
    elementState: bannerElementState,
    elemNumber: number,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    languageCode: string,
    checkErrors: boolean,
    resolution: {
        height: string,
        width: string
    },
    accept?: {
        [key in fileTypes]?: fileExtensions[key]
    },
    maxImageSize?:number, maxGifSize?:number,
    useSaleshub?: boolean
}

export interface youtubeInputsProps {
    elementState: bannerElementState,
    elemNumber: number,
    languageCode: string,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    checkErrors: boolean,
    resolution: {
        height: string,
        width: string
    },
    maxImageSize?:number, maxGifSize?:number,
    useSaleshub?: boolean
}
export interface youtubeLinkInputsProps {
    elementState: bannerElementState,
    elemNumber: number,
    languageCode: string,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    checkErrors: boolean
}

export interface googleInputsProps {
    elementState: bannerElementState,
    elemNumber: number,
    languageCode: string,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    checkErrors: boolean,
    resolution: {
        height: string,
        width: string
    },
    maxImageSize?:number, maxGifSize?:number,
    useSaleshub?: boolean
}
export interface communicationInputsProps {
    elementState: bannerElementState,
    elemNumber: number,
    languageCode: string,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    checkErrors: boolean,
    resolution: {
        height: string,
        width: string
    },
    maxImageSize?:number, maxGifSize?:number
}
export interface categoryInputsProps {
    elementState: bannerElementState,
    elemNumber: number,
    languageCode: string,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    checkErrors: boolean,
    resolution: {
        height: string,
        width: string
    },
    categories: string[],
    maxImageSize?:number, maxGifSize?:number
}

export interface ImageWithBasketIdInputsProps {
    elementState: bannerElementState,
    elemNumber: number,
    languageCode: string,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    checkErrors: boolean,
    resolution: {
        height: string,
        width: string
    },
    baskets?: string[],
    maxImageSize?:number, maxGifSize?:number
}
export type mediaNameIdType =  "mediaNameone" | "mediaNametwo" | "mediaNamethree" | "mediaNamefour" | "mediaNamefive";
type ElementKey = `cat_${mediaNameIdType}` | `subCat_${mediaNameIdType}` | `skuCode_${mediaNameIdType}` | `pieceSize_${mediaNameIdType}` | `brand_${mediaNameIdType}` | "schemeId";

export type categoryElementComponents = {
  [key in ElementKey]?: string[];
} & { redirection?: string }& { additionalBlobKey?: string }& { additionalTogglePosition?: string };

export interface categorySubcategoryProps{
    elementState: bannerElementState,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    checkErrors: boolean,
    categories: string[],
    productFilterResetCounter: number,
    languageCode: string,
    elemNumber: number,
    maxSelection?:number,
    autoSelectScheme?:boolean
}

export interface GenericMultiSelectProps{
    options: string[],
    limitTags?: number,
    label: string,
    onInputChange?: (event: React.SyntheticEvent<Element, Event>)=>void;
    selectedOptions: string[],
    handleMultiSelectState: (selectedOptions: string[]) => void,
    noOptionMessage?: string,
    isRequired: boolean,
    errorMessage?: string,
    renderInput?: (params:AutocompleteRenderInputParams)=>any
    className?: string,
    textFieldProps?:Partial<any>,
    params?: {
        size?: "small" | "medium";
        disabled?: boolean;
        disableClearable?: boolean;
    }
    disabled?:boolean 
    disable?:any
    maxSelect?:number
    autoSelect?:boolean
}

export interface bannerData{
    bannerName: string,
    id: string,
    bannerType: string,
    bannerDescription: string,
    bannerTemplateType: string,
    activeStatus: string,
    bannerElements: bannerElementState[],
    extendedAttributes: {
        bankName?: string,
        distributionData: {
            activeStatus: string,
            banner: string,
            startDate: string,
            endDate: string
        },
        resolution?:any,
        mapped?:boolean
    }
}
export interface bannerReduxState{
    bannerData: bannerData | null,
    isUpdated?: boolean
}

export interface bannerPayload{
   bannerState?: bannerData | null,
   isUpdated?: boolean
}

export type BannerInputsComponentRef = {
    reset: () => void,
  };

export interface GenericImageUploadComponentProps{
    handleImageUpload: () => void,
    file: File | null,
    blobKey?: string,
    fileName?: string,
    resolution: {
        width: string,
        height: string
    },
    handleUpload: (event: ChangeEvent<HTMLInputElement>) => void,
    setLanguageBannerState:  React.Dispatch<React.SetStateAction<languageBannerState>>,
    elementState: bannerElementState,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    fileInputRef: React.RefObject<HTMLInputElement>,
    errorMessage?: string,
    checkErrors?: boolean,
    imageDescription?: string,
    languageCode: string,
    elemNumber: number
}
export interface CreateBannerProps{
    parentType?: "bucket" | "block",
    parentView?: viewType, //parentComponent View
    parentId?: string, 
    handleParentDataSubmit?: (innerComponent: bucketInnerComponent | blockInnerComponent) => Promise<void>,
    validateAllParentInputs?: () => string
}
export interface CreateBannerNavigate{
    currentBanner?: bannerData
}
export interface productMetadataSkuObj{
    category: string,
    sub_category_code: string,
    sku_code: string
}
export interface bannerLocationState{
    isBucketEdit: boolean,
    currentBanner?: bannerData
}
export interface bannerfilterConfigObj {
    id: productParam,
    label: string
}
export interface bannerProductFilter{
    id: productParam,
    label: string,
    options: string[]
}
export interface productDetailsResponse {
    pieceSize?: string,
    category?: string,
    brand?: string,
    subCategoryCode?: string,
    schemeId?:string,
    name?:string
}
export interface productFilterOption {
    id: productParam,
    label: string,
    options: string[]
}
export interface bannerProductFilterMappingObj {
    id: productParam | "selectedSKUcodes",
    value: "cat" | "skuCode" | "subCat" | "pieceSize" | "brand"
}
export type languageBannerState = Record<string,bannerElementState[]>;
export interface bannerLanguageSelectionProps{
    selectedTab: number,
    setSelectedTab: React.Dispatch<React.SetStateAction<number>>,
    languageOptions: languageOptions[],
    languageBannerState: languageBannerState,
    validateCurLanguageBannerElements: (langBannerElements: bannerElementState[],invalidCountStart: number,anyBannerElementSelectedTillNow: boolean) => { message: string, invalidCount: number, isBannerTypeSelected: boolean }
}
export interface bannerElementsProps{
    bannerElements: bannerElementState[],
    languageCode: string,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    bannerTemplateType: BannerTemplate | null,
    checkErrors: boolean,
    categories: string[],
    baskets?: string[],
    isEdit?:any
}
export interface SkuCodeMultiSelectProps {
    elementState: bannerElementState,
    setLanguageBannerState: React.Dispatch<React.SetStateAction<languageBannerState>>,
    elemNumber: number,
    languageCode: string,
    initialLoadRef: React.MutableRefObject<boolean>,
    selectedFilterOptionsRef: React.MutableRefObject<{
        category?: string[] | undefined;
        subCategoryCode?: string[] | undefined;
        brand?: string[] | undefined;
        pieceSize?: string[] | undefined;
        }>
}
export interface paginationState {
    page: number,
    pageSize: number
}
export type bannerSearchParams = "id" | "bannerName" | "bannerDescription" | "bannerTemplateType";
export interface bannerTypeOption {
    id: "image"| "youtube"| "google"| "communication" | "Image with Products" | "survey" | "ImageWithBasketId" | "youtubeLink" | "" | "gif" | "redirectToPage" | "imageWithSchemes" | "contestBanner", //"" for default option
    label: string
}
export interface bannerV2DataPayload {
    banner: any,
    bannerDistribution: any,
    metaData?: any[]
}