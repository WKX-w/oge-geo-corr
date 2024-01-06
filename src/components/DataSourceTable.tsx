/**
 * DataSourceTable
 *
 * @author shepard
 * @date 2023/3/19
 */
import React, { useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import { getDataSourceTableColDef } from "./DataSourceTable.data";
import { DataSourceTableToolbar } from "./DataSourceTableToolbar";
import { isEqual } from "lodash";

// ----- Components ----- //
import { DataGrid, zhCN, enUS, DataGridProps } from "@mui/x-data-grid";

// ----- Interfaces ----- //
import { DataSource, DataSourceStatus, CorrectionTask, CorrentionTaskBandResult } from "@/types";
import { Certain } from "@/types/utils";

// ----- Stylesheet ----- //
import styles from "./DataSourceTable.module.scss";
import { useMixedState } from "@/hooks/mixState";

const localeMap: Record<string, typeof zhCN> = {
    "zh-CN": zhCN,
    "en-US": enUS,
};

function DataSourceTableRender<T extends DataSourceTable.DataSourceTableMode = "data">(
    {
        className = "",
        data,
        onDataChange,
        onSelectionChange,
        selectionMode,
        mode,
        toolbar,
        hideFooterRowCount,
        selectedData,
        ...otherProps
    }: DataSourceTable.Props<T>,
    ref: React.ForwardedRef<HTMLDivElement>
) {
    type DataType = DataSourceTable.DataSourceTableDataType[T];

    const intl = useIntl();

    const handleDownloadBand = useCallback((data: CorrentionTaskBandResult) => {
        window.open(data.url.replace("http://125.220.153.22:8027", "http://oge.whu.edu.cn/corr-data"));
    }, []);

    const handleDownloadAllBands = useCallback(async (data: CorrentionTaskBandResult[]) => {
        const down = async (url: string) => {
            return new Promise(() => {
                setTimeout(() => {
                    window.open(url.replace("http://125.220.153.22:8027", "http://oge.whu.edu.cn/corr-data"));
                }, 300);
            });
        };
        for (const res of data) {
            await down(res.url);
        }
    }, []);

    const colDef = useMemo(
        () =>
            getDataSourceTableColDef(intl, mode, {
                onDownloadAllBands: handleDownloadAllBands,
                onDownloadBand: handleDownloadBand,
            }),
        [intl]
    );

    const [myData, setMyData] = useMixedState(data, onDataChange);

    const [mySelectedData, setMySelectedData] = useMixedState<number[] | undefined>(
        selectionMode !== "none" ? selectedData : undefined,
        onSelectionChange ? (state) => onSelectionChange(state ?? []) : undefined
    );

    const handleSelectionChange = useCallback<Certain<DataGridProps["onRowSelectionModelChange"]>>(
        (rowSelectionModel) => {
            if (selectionMode === "none") return;

            setMySelectedData((currentSelected) => {
                if (isEqual(currentSelected, rowSelectionModel)) return currentSelected;
                return rowSelectionModel as number[];
            });
        },
        [setMySelectedData, selectionMode]
    );

    return (
        <DataGrid
            className={`${styles["data-source-table"]} ${className} `}
            ref={ref}
            {...otherProps}
            rows={myData}
            columns={colDef}
            localeText={localeMap[intl.locale].components.MuiDataGrid.defaultProps.localeText}
            initialState={{
                pagination: { paginationModel: { page: 0, pageSize: 100 } },
            }}
            pageSizeOptions={[100]}
            checkboxSelection={selectionMode === "checkbox"}
            slots={{ toolbar: toolbar ? DataSourceTableToolbar : null }}
            hideFooterSelectedRowCount={hideFooterRowCount}
            getRowId={(row: DataSource) => row.rasterId}
            getRowHeight={() => "auto"}
            getRowClassName={({ row }) => {
                const checkModeClassName =
                    styles[
                        selectionMode === "checkbox"
                            ? "table-row--checkbox"
                            : "table-row--row-select"
                    ];
                let modeClassName = "";
                if (mode === "status") {
                    const data = row as DataSourceStatus;
                    modeClassName =
                        styles[
                            `table-row-status--${
                                data.pending ? "pending" : data.available ? "available" : "no-data"
                            }`
                        ];
                } else if (mode === "tasks") {
                    const data = row as CorrectionTask;
                    modeClassName =
                        styles[
                            `table-row-status--${
                                data.status === "running"
                                    ? "pending"
                                    : data.status === "success"
                                    ? "available"
                                    : "no-data"
                            }`
                        ];
                }
                return [checkModeClassName, modeClassName].join(" ");
            }}
            isRowSelectable={({ row }) => {
                if (mode === "data") return true;
                else if (mode === "status") {
                    return (row as DataSourceStatus).available;
                } else if (mode === "tasks") {
                    return false;
                }
                return true;
            }}
            rowSelectionModel={mySelectedData}
            onRowSelectionModelChange={handleSelectionChange}
        />
    );
}

// 导出泛型组件
export const DataSourceTable = React.forwardRef(DataSourceTableRender) as <
    T extends DataSourceTable.DataSourceTableMode = "data"
>(
    props: DataSourceTable.Props<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => ReturnType<typeof DataSourceTableRender>;

DataSourceTableRender.displayName = "DataSourceTable";

// eslint-disable-next-line
export namespace DataSourceTable {
    export type DataSourceTableDataType = {
        data: DataSource[];
        status: DataSourceStatus[];
        tasks: CorrectionTask[];
    };
    export type DataSourceTableMode = "data" | "status" | "tasks";
    export interface Props<T extends DataSourceTableMode = "data"> {
        mode: T;
        className?: string;
        data: DataSourceTableDataType[T];
        selectedData?: number[];
        onSelectionChange?: (data: number[]) => void;
        onDataChange?: (data: DataSourceTableDataType[T]) => void;
        selectionMode: "checkbox" | "single-row" | "none";
        toolbar: boolean;
        hideFooterRowCount?: boolean;
    }
}
