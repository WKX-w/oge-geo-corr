/**
 * DataSourceTableToolbar
 *
 * @author shepard
 * @date 2023/3/20
 */
import React from "react";

// ----- Components ----- //
import {
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarExport,
} from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import IconDelete from "@mui/icons-material/Delete";
import IconSearch from "@mui/icons-material/Search";

// ----- Interfaces ----- //

// ----- Stylesheet ----- //
import styles from "./DataSourceTableToolbar.module.scss";

export const DataSourceTableToolbar = React.forwardRef<
    HTMLDivElement,
    DataSourceTableToolbar.Props
>(({ className = "", onDelete, enableDelete, onSearch, enableSearch, ...otherProps }, ref) => {
    return (
        <GridToolbarContainer
            className={`${styles["data-source-table-toolbar"]} ${className} `}
            ref={ref}
            {...otherProps}
        >
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <div className={`Flex-space`}></div>
        </GridToolbarContainer>
    );
});

DataSourceTableToolbar.displayName = "DataSourceTableToolbar";

// eslint-disable-next-line
export namespace DataSourceTableToolbar {
    export interface Props extends React.ComponentPropsWithRef<"div"> {
        enableDelete?: boolean;
        onDelete?: () => void;
        enableSearch?: boolean;
        onSearch?: () => void;
    }
}
