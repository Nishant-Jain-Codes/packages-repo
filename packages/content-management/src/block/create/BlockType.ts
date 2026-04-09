import { BlockObjType } from "./CreateBlockTypes";

// export const blockTypes = ["Banner","Bucket","Basket","PromoBlock","couponbasket"];
export const blockGeneralTypes = [
    {
        id: "Banner",
        label: "Banner"
    },
    {
        id: "Bucket",
        label: "Bucket"
    },
    {
        id: "Basket",
        label: "Basket"
    },
    // {
    //     id: "other",
    //     label: "Other Block"
    // }
]
export const blockTypes = [
    {
        id: "Banner",
        label: "Banner"
    },
    {
        id: "Bucket",
        label: "Bucket"
    },
    {
        id: "Basket",
        label: "Basket"
    },
    {
        id: "PromoBlock",
        label: "Promo Banner Block"
    },
    {
        id: "couponbasket",
        label: "Coupon Block"
    }
]
export const BlockTypesOther = [
    {
        id: "PromoBlock",
        label: "Promo Banner Block"
    },
    {
        id: "couponbasket",
        label: "Coupon Block"
    }
]
export const filterBlockTypes = ["New","Link from existing"];

export const defaultBlockObj: BlockObjType = {
    id: "",
    type: "",
    name: ""
}
export const defaultSelectedBlockType = {
    label: "",
    id: ""
}