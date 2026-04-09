import { BannerTemplate } from "@/utils/UtilityService";
import { bannerProductFilterMappingObj } from "@/features/content-management/banner/create/bannerTypes";

// catSubCatReq = true in bannerTemplates means that the banner requires categories,subcategories,skucodes data
export const bannerTemplates: BannerTemplate[] = [
    {
        label: "Communication Banner",
        options: [
            { 
                id: "image",
                label: "Image"
            },{
                id: "youtube",
                label: "Youtube"
            },{
                id: "google",
                label: "Google"
            },{
                id: "communication",
                label: "Communication"
            },{
                id: "Image with Products",
                label: "Image With Products"
            },{
                id: "survey",
                label: "Survey"
            }
        ],
        id: "template1",
        resolution:{height:"376",width:"1024"}
    },
    {
        label: "OneClick Banner",
        options: [
            { 
                id: "image",
                label: "Image"
            }
        ],
        id: "template2",
        // resolution:{height:"300",width:"1000"}
        resolution:{height:"376",width:"1024"}
    },
    {
        label: "TopScheme Banner",
        options: [
            { 
                id: "image",
                label: "Image"
            },{
                id: "youtube",
                label: "Youtube"
            },{
                id: "google",
                label: "Google"
            },{
                id: "communication",
                label: "Communication"
            }
        ],
        id: "template3",
        // resolution:{height:"400",width:"1024"}
        resolution:{ height:"416" ,width:"500" },
    },{
        label: "App schemes banner",
        displayName:"New App schemes banner",
        options: [
            { 
                id: "image",
                label: "Image"
            }
        ], 
        id: "template28",
        resolution:{ height:"416" ,width:"500" },
        catSubCatReq: true
    },{
        label: "App schemes banner",
        options: [
            { 
                id: "image",
                label: "Image With Products"
            },
            { 
                id: "imageWithSchemes",
                label: "Image With Schemes"
            }
        ], 
        id: "template9",
        resolution:{ height:"416" ,width:"500" },
    },{
        label: "Campaign banner",
        options: [
            { 
                id: "Image with Products",
                label: "Image With Products"
            },
            { 
                id: "imageWithSchemes",
                label: "Image With Schemes"
            }
        ], 
        id: "template999",
        resolution:{ height:"240" ,width:"210" },
    },{
        label: "Need based basket banner",
        options: [
            { 
                id: "image",
                label: "Image"
            }
        ],
        id: "template29",
        resolution:{ height:"420" ,width:"300" },
        catSubCatReq: true
    },{
        label: "Banking Banner1",
        options: [
            { 
                id: "image",
                label: "Image"
            },{
                id: "youtube",
                label: "Youtube"
            },{
                id: "google",
                label: "Google"
            }
        ],
        id: "template14",
        resolution:{ height:"400" ,width:"1024" }
    },{
        label: "Banking Banner2",
        options: [
            { 
                id: "image",
                label: "Image"
            },{
                id: "youtube",
                label: "Youtube"
            },{
                id: "google",
                label: "Google"
            }
        ],
        id: "template15",
        resolution:{ height:"400" ,width:"1024" }
    },{
        label: "Banking Banner3",
        options: [
            { 
                id: "image",
                label: "Image"
            },{
                id: "youtube",
                label: "Youtube"
            },{
                id: "google",
                label: "Google"
            }
        ],
        id: "template16",
        resolution:{ height:"400" ,width:"1024" }
    },{
        label: "Banking Banner4",
        options: [
            { 
                id: "image",
                label: "Image"
            },{
                id: "youtube",
                label: "Youtube"
            },{
                id: "google",
                label: "Google"
            }
        ],
        id: "template17",
        resolution:{ height:"400" ,width:"1024" }
    },{
        label: "Offer Banner",
        options: [
            { 
                id: "image",
                label: "Image"
            }
        ],
        id: "template19",
        resolution:{ height:"400" ,width:"1000" }
    },{
        label: "Tv Adds",
        options: [
            {
                id: "youtubeLink",
                label: "Youtube Link"
            }
        ],
        id: "template20",
        resolution: {height: "572", width: "1024"}
    },{
        label: "Scanner Banner",
        options: [
            { 
                id: "image",
                label: "Image"
            }
        ],
        id: "template21",
        resolution: {height: "400", width: "1024"}
    },{
        label: "Basket Banner",
        options: [
            {
                id: "ImageWithBasketId",
                label: "Image with BasketId"
            }
        ],
        id: "template22",
        resolution: {height: "376", width: "1024"}
    },{
        label: "Communication Banner 2",
        options: [
            { 
                id: "image",
                label: "Image"
            },{
                id: "youtube",
                label: "Youtube"
            },{
                id: "google",
                label: "Google"
            },{
                id: "communication",
                label: "Communication"
            },{
                id: "Image with Products",
                label: "Image With Products"
            },{
                id: "survey",
                label: "Survey"
            }
        ],
        id: "template24",
        resolution:{height:"376",width:"1024"}
    },{
        label: "Communication Banner 3",
        options: [
            { 
                id: "image",
                label: "Image"
            },{
                id: "youtube",
                label: "Youtube"
            },{
                id: "google",
                label: "Google"
            },{
                id: "communication",
                label: "Communication"
            },{
                id: "Image with Products",
                label: "Image With Products"
            },{
                id: "survey",
                label: "Survey"
            }
        ],
        id: "template25",
        resolution:{height:"376",width:"1024"}
    },{
        label: "Order Tracking",
        options: [
            { 
                id: "image",
                label: "Image"
            }
        ],
        id: "template26",
        resolution:{height:"376",width:"1024"}
    },{
        label: "All Catalogue",
        options: [
            { 
                id: "image",
                label: "Image"
            }
        ],
        id: "template27",
        resolution:{height:"376",width:"1024"}
    },{
        label: "Custom Products Banner",
        options: [
            { 
                id: "image",
                label: "Image"
            }
        ],
        id: "template30",
        resolution:{height:"376",width:"1024"}
    },{
        label: "Festive Banner",
        options: [
            { 
                id: "image",
                label: "Image"
            },
            {
                id: "gif",
                label: "GIF"
            }
        ],
        id: "template31",
        resolution: {height:"270",width:"1024"}
    },{
        label: "No Order",
        options: [
            { 
                id: "image",
                label: "Image"
            }
        ],
        id: "template33",
        resolution: {height:"376",width:"1024"}
    },
    {
        label: "Basket Oneclick Banner",
        options: [
            {
                id: "ImageWithBasketId",
                label: "Image with BasketId"
            }
        ],
        id: "template32",
        resolution: {height: "572", width: "1024"}
    },
    {
        label: "Promo Banner",
        options: [
            { 
                id: "image",
                label: "Image"
            },{
                id: "youtube",
                label: "Youtube"
            },{
                id: "google",
                label: "Google"
            },{
                id: "communication",
                label: "Communication"
            },{
                id: "Image with Products",
                label: "Image With Products"
            },{
                id: "redirectToPage",
                label: "Redirect To Page"
            }
        ],
        id: "template34",
        resolution:{ height:"416" ,width:"500" },
        priorityFilter: true
    },
    {
        label: "Ambient Display banner",
        options: [
            {
                id: "image",
                label: "Image"
            }
        ],
        id: "template35",
        resolution: {height: "376", width: "1024"}
    },
    {
        label: "Remote order banner",
        options: [
            {
                id: "image",
                label: "Image"
            }
        ],
        id: "template36",
        resolution: {height: "376", width: "1024"}
    },
    {
        label: "Communication Banner V2",
        options: [
            { 
                id: "image",
                label: "Image"
            },{
                id: "youtube",
                label: "Youtube"
            },{
                id: "google",
                label: "Google"
            },{
                id: "communication",
                label: "Communication"
            },{
                id: "Image with Products",
                label: "Image With Products"
            },{
                id: "survey",
                label: "Survey"
            },{
                id: "redirectToPage",
                label: "Redirect To Page"
            }
        ],
        id: "template38",
        resolution:{height:"376",width:"1024"},
        priorityFilter: true
    },
    {
        label: "Contest banner",
        options: [
            {
                id: "contestBanner",
                label: "Contest Banner"
            }
        ],
        id: "template39",
        resolution: {height: "376", width: "1024"}
    },
    {
        label: "No Order",
        options: [
            { 
                id: "image",
                label: "Image"
            }
        ],
        id: "template33",
        resolution: {height:"376",width:"1024"}
    },
    {
        label: "Large Banner",
        options: [
            { 
                id: "image",
                label: "Image With Products"
            },
            { 
                id: "imageWithSchemes",
                label: "Image With Schemes"
            }
        ],
        id: "template123",
        resolution: {height:"600",width:"550"}
    },
    //  {
    //     label: "Toggle Banner",
    //     options: [
    //     { 
    //             id: "image",
    //             label: "Image"
    //         }
    //     ], 
    //     id: "template1234",
    //     resolution: {height:"270",width:"1024"},
    //     toggleResolution: {height:"120",width:"180"}
    // },

];

export const bannerProductFilterMapping: bannerProductFilterMappingObj[] = [
    {
        id: "category",
        value: "cat"
    },
    {
        id: "subCategoryCode",
        value: "subCat"
    },
    {
        id: "selectedSKUcodes",
        value: "skuCode"
    },
    {
        id: "pieceSize",
        value: "pieceSize"
    },
    {
        id: "brand",
        value: "brand"
    }
];

export const bucketLinkedBannerTemplates = ["template8" ,"template29","template32","template999"]

export const redirectionScreens = [
    {
        id: "orderTracking",
        label: "Order Tracking"
    },
    {
        id: "order",
        label: "All Catalogue"
    },
    {
        id: "consumerPromo",
        label: "Consumer Promo"
    },
    {
        id: "couponOffers",
        label: "Offers"
    },
    {
        id: "helpdesk",
        label: "Support"
    },
    {
        id: "LanguageScreen",
        label: "Language"
    },
    {
        id: "Notifications",
        label: "Notification"
    },
    {
        id: "tncLink",
        label: "Terms & Conditions"
    },
    {
        id: "privacyLink",
        label: "Privacy"
    },
    {
        id: "faqScreen",
        label: "Faq Screen"
    },
    {
        id: "rewards",
        label: "Rewards"
    },
    {
        id: "/PjpTrackingScreen",
        label: "PJP Tracking Screen"
    },
    {
        id: "irCardScreen",
        label: "IRED"
    },
    {
        id: "outletScreen-dbVisit",
        label: "Outlet Screen"
    },
    {
        id: "outletScreen-alldb",
        label: "All Distributor Screen"
    },
    {
        id: "outletScreen-routeScreen-pjp",
        label: "Route Screen"
    },
    {
        id: "outletScreen-all",
        label: "All Outlet Screen"
    },
    {
        id: "PjpCreationScreen",
        label: "PJP Creation Screen"
    },
    {
        id: "scaiCall",
        label: "SCAI Call"
    },
    {
        id: "vendorRequestsScreen",
        label: "Vendor Requests Screen"
    },
    {
        id: "allProductsScreen",
        label: "Favourite Screen"
    } 
].sort((a, b) => a.label.localeCompare(b.label));