import { bannerSearchParams } from "@/features/content-management/banner/create/bannerTypes";

export const ManageBasketConfig = {
    columns:[
        {headerName:"Basket ID",mappedValue:"id"},
        {headerName:"Basket Data Source",mappedValue:"type"},
        {headerName:"Basket Title",mappedValue:"title"},
        {headerName:"Subtitle",mappedValue:"subtitle"},
        {headerName:"Basket Tag Name",mappedValue:"tag"},
        {headerName:"Basket Tag Color",mappedValue:"tagColor"},
    ],
    Actions:[
        "Update",
        "Delete",
        "ChangeStatus"
    ]
}
export const defaultBasketConfig = [
    {
      "name": "orderBasketMapping",
      "type": "List",
      "value": [],
      "docUrl": "https://applicate.atlassian.net/l/cp/90s18da0",
      "description": "basket config",
      "defaultValue": null,
      "possibleVals": []
    }
]
export const manageBasketSearchParams = ["id","title","type"]