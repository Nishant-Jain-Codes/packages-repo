import { configurationAttributeType } from "@/types"
import { retailerAppLayoutConfigObj } from "@/features/content-management/block/create/CreateBlockTypes"

export const ManageHomePageConfig = {
    columns:[
        {headerName:"",mappedValue:"dragIcon"},
        {headerName:"Block ID",mappedValue:"id"},
        {headerName:"Block Name",mappedValue:"name"},
        {headerName:"Block Type",mappedValue:"type"},
        {headerName:"Update",mappedValue:"updateButton"},
        {headerName:"Delete",mappedValue:"deleteButton"},
        {headerName:"Active Status",mappedValue:"activeToggle"},

    ]
}
export const HomeScreenManagementConfig = {
    columns:[
        {headerName:"",mappedValue:"dragIcon"},
        {headerName:"Block Name",mappedValue:"name"},
        {headerName:"Block ID",mappedValue:"id"},
        {headerName:"Block Type",mappedValue:"type"},
        {headerName:"Update",mappedValue:"updateButton"},
        // {headerName:"Delete",mappedValue:"deleteButton"},
        {headerName:"Active Status",mappedValue:"activeToggle"},

    ]
}
export const defaultBlockConfig: retailerAppLayoutConfigObj[] = [
    {	
        "name": "homeScreenBlockWidget",	
        "type": "widgetLayout",	
        "value": [],	
        "docUrl": "https://applicate.atlassian.net/l/cp/90s18da0",	
        "description": "home page layout config",	
        "defaultValue": null,	
        "possibleVals": [	
          "widgetLayout",	
          "formLayout",	
          "reportLayout"	
        ]	
    }
]