import { bucketSearchParams } from "@/features/content-management/bucket/create/CreateBucketTypes";

export const ManageBucketConfig = {
    columns:[
        {headerName:"Bucket ID",mappedValue:"id"},
        {headerName:"Bucket Design",mappedValue:"bucketDesignLabel"},
        {headerName:"Bucket Type",mappedValue:"primarySource"},
        {headerName:"Bucket Title",mappedValue:"title"},
        {headerName:"Bucket Subtitle",mappedValue:"subtitle"},
    ],
    Actions:[
        "Update",
        "Delete",
        "ChangeStatus"
    ]
}
export const defaultBucketConfig = [
    {
      "name": "bucketConfiguration",
      "type": "List",
      "value": [],
      "docUrl": "https://applicate.atlassian.net/l/cp/90s18da0",
      "description": "bucket-config",
      "defaultValue": null,
      "possibleVals": []
    }
];
export const manageBucketSearchParams: bucketSearchParams[] = ["id","bucketDesign","title"];