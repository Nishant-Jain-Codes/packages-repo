import { bannerSearchParams } from "@/features/content-management/banner/create/bannerTypes";

export const defaultBannerConfig = [
    {
      "name": "bannerConfiguration",
      "type": "List",
      "value": [
        {
          "name": "bannerElementProductFilters",
          "value": [
            {
              "id": "category",
              "label": "Select Category"
            },
            {
              "id": "subCategoryCode",
              "label": "Select Sub Category Code"
            }
          ]
        },
        {
          "name": "skuCodeFilterParam",
          "value": "skuCode"
        },
        {
          "name": "languageBasedBanner",
          "value": false
        }
      ],
      "docUrl": "https://applicate.atlassian.net/l/cp/90s18da0",
      "description": "banner-config",
      "defaultValue": null,
      "possibleVals": []
    }
]

export const manageBannerSearchParams: bannerSearchParams[] = ["id","bannerName","bannerDescription","bannerTemplateType"];