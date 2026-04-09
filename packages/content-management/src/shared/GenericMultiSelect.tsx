import * as React from "react";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { Chip } from "@mui/material";
import { GenericMultiSelectProps } from "@/features/content-management/banner/create/bannerTypes";
import { TranslationEnum, usePortalTranslation } from "@/utils/TranslationProvider";
import { openPopup } from "@/stateManagement/actions/popupActions";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const allOption = "Select All" ;

export default function GenricMultiSelect(props: GenericMultiSelectProps) {
  const { translate } = usePortalTranslation();
  const CUR_COMPONENT_COMMON="commonPortal";
  const {selectedOptions, options} = props;
  const [selectAllState, setSelectAllState] = React.useState<boolean>(false);
  React.useEffect(() => {
    setSelectAllState((selectedOptions && options)? selectedOptions.length === options.length : false);
  },[])

  // const handleSelectAll = (event: any, value: any) => {
  //   const allOptionsSelected = (selectedOptions && options)
  //     ? selectedOptions.length === options.length
  //     : selectAllState;
  
  //   if (value.includes(allOption)) {
  //     if (!allOptionsSelected) {
  //       const newSelection = props.maxSelect
  //         ? props.options.slice(0, props.maxSelect)
  //         : props.options;
  //       props.handleMultiSelectState(newSelection);
  //       setSelectAllState(newSelection.length === props.options.length);
  //     } else {
  //       props.handleMultiSelectState([]);
  //       setSelectAllState(false);
  //     }
  //   } else {
  //     const isReducingSelection =
  //       (selectedOptions?.length || 0) > value.length;
  //     if (
  //       !props.maxSelect ||
  //       value.length <= props.maxSelect ||
  //       isReducingSelection
  //     ) {
  //       props.handleMultiSelectState(value);
  //       setSelectAllState(value.length === props.options.length);
  //     }
  //   }  
  // };
  const handleSelectAll = (event: any, value: any) => {
    const allOptionsSelected = (selectedOptions && options)
      ? selectedOptions.length === options.length
      : selectAllState;
  
    if (value.includes(allOption)) {
      if (!allOptionsSelected) {
        if (props.maxSelect && props.options.length > props.maxSelect) {
          openPopup("Error","You can only select up to " + props.maxSelect + " options");
          return; 
        }
        const newSelection = props.maxSelect
          ? props.options.slice(0, props.maxSelect)
          : props.options;
  
        props.handleMultiSelectState(newSelection);
        setSelectAllState(newSelection.length === props.options.length);
      } else {
        props.handleMultiSelectState([]);
        setSelectAllState(false);
      }
    } else {
      const isReducingSelection =
        (selectedOptions?.length || 0) > value.length;
      if (
      props.maxSelect &&
      value.length > props.maxSelect &&
      !isReducingSelection
    ) {
      openPopup("Error", "You can only select up to " + props.maxSelect + " options");
      return;
    }
     let finalSelection = [...value];

    if (props.autoSelect) { 
      const newlySelected = value.find((v: string) => !selectedOptions?.includes(v));
      if (newlySelected && newlySelected.includes("-")) {
        const prefix = newlySelected.split("-")[0].trim();

        // find all options with same prefix
        const relatedOptions = options.filter((opt) =>
          opt.startsWith(prefix + "-")
        );

        // add all related options not already selected
        relatedOptions.forEach((opt) => {
          if (!finalSelection.includes(opt)) {
            finalSelection.push(opt);
          }
        });
      }
    }
    props.handleMultiSelectState(finalSelection);
    setSelectAllState(value.length === props.options.length);
    }
  };
  return (
    <Autocomplete
      disabled={props?.disabled !== undefined ? props?.disabled : props?.disable !== undefined ? props?.disable : false} 
      disableClearable
      onInputChange={props.onInputChange ?? ((event)=>{})}
      className={props.className}
      noOptionsText={props.noOptionMessage}
      multiple 
      id="genricMultiSelect"
      options={props.options.length>0?[allOption, ...props.options]:[]}
      disableCloseOnSelect
      renderTags={(tagValue, getTagProps) => {
        return (
          <>
            {tagValue.slice(0, props?.limitTags || 4).map((option, index) => (
              <Chip
              sx={{
                "&.Mui-disabled": {
                  opacity: 0.6,                
                },
              }}
              label={option}
              {...getTagProps({ index })}
              />
              ))}
            {tagValue.length > (props?.limitTags || 4) ? <>+{tagValue.length - (props?.limitTags || 4)}</> : <></>}
          </>
        );
      }}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          <Checkbox
            icon={icon}
            checkedIcon={checkedIcon}
            style={{ marginRight: 8 }}
            checked={option === "Select All" ? ((selectedOptions && options)? selectedOptions.length === options.length : selectAllState): selected}
            />
          {option}
        </li>
      )}
      onChange={handleSelectAll}
      value={props.selectedOptions || []}
      renderInput={(params) => (
          <TextField {...params}  error={props.isRequired && !(props.selectedOptions?.length>0)} helperText={props.isRequired && !(props.selectedOptions?.length>0) && props.errorMessage} label={translate(TranslationEnum.generic_filters,props.label)} placeholder={translate(TranslationEnum.common_portal,"Search")+"..."}
              {...props.textFieldProps}
          />
        )}
      limitTags={props.limitTags}
      {...props.params}
      />
        );
      }
      