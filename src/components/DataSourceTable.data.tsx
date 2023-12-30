import { CorrectionTask, DataSource, DataSourceStatus } from "@/types";
import { GridColDef, GridRenderCellParams, GridValueFormatterParams } from "@mui/x-data-grid";
import Image from "next/image";
import { FormattedMessage, IntlShape } from "react-intl";
import styles from "./DataSourceTable.module.scss";
import MissingImage from "/public/images/missing.png";
import { Tooltip } from "@mui/material";
import { DataSourceTable } from "./DataSourceTable";
import { TaskOperation } from "./TaskOperation";

export function getDataSourceTableColDef(
    intl: IntlShape,
    mode: DataSourceTable.DataSourceTableMode,
    {
        onDownloadAllBands,
        onDownloadBand,
    }: Pick<TaskOperation.Props, "onDownloadAllBands" | "onDownloadBand">
): GridColDef[] {
    const taskInfoColumns: GridColDef[] =
        mode === "tasks"
            ? [
                  {
                      field: "taskOperations",
                      headerName: intl.formatMessage({
                          defaultMessage: "任务操作",
                          id: "dataSourceTable.columns.taskOperations",
                      }),
                      renderCell: (params) => {
                          const rowData = params.row as CorrectionTask;
                          return (
                              <TaskOperation
                                  task={rowData}
                                  onDownloadAllBands={onDownloadAllBands}
                                  onDownloadBand={onDownloadBand}
                              />
                          );
                      },
                      minWidth: 150, // 275 for two buttons
                      sortable: false,
                  },
              ]
            : [];

    return (
        taskInfoColumns.concat([
            {
                field: "thumbnailUrl",
                headerName: intl.formatMessage({
                    defaultMessage: "预览图",
                    id: "dataSourceTable.columns.thumbnail",
                }),
                description: intl.formatMessage({
                    defaultMessage: "影像数据的小样预览图",
                    id: "dataSourceTable.columns.thumbnail.descrip",
                }),
                renderCell: (
                    params: GridRenderCellParams<DataSource | DataSourceStatus | CorrectionTask>
                ) => {
                    const rowData = params.row as Partial<DataSourceStatus>;
                    return (
                        <Tooltip
                            title={
                                rowData.available === false ? (
                                    <FormattedMessage
                                        id="dataSourceTable.columns.thumbnail.noRegImage"
                                        defaultMessage="无法找到配准影像或WMTS服务启动失败"
                                    />
                                ) : (
                                    ""
                                )
                            }
                        >
                            <Image
                                alt=""
                                width={50}
                                height={50}
                                style={{ cursor: rowData.available === false ? "help" : "" }}
                                src={params.value || MissingImage}
                            ></Image>
                        </Tooltip>
                    );
                },
                sortable: false,
                align: "center",
                headerAlign: "center",
            },
            {
                field: "rasterId",
                headerName: intl.formatMessage({
                    defaultMessage: "ID",
                    id: "dataSourceTable.columns.rasterId",
                }),
                description: intl.formatMessage({
                    defaultMessage: "影像的唯一标识符",
                    id: "dataSourceTable.columns.rasterId.descrip",
                }),
                type: "number",
                valueFormatter: (params) => params.value,
            },
            {
                field: "rasterName",
                headerName: intl.formatMessage({
                    defaultMessage: "影像编号",
                    id: "dataSourceTable.columns.rasterName",
                }),
                description: intl.formatMessage({
                    defaultMessage: "影像的格式化编号",
                    id: "dataSourceTable.columns.rasterName.descrip",
                }),
                cellClassName: styles["cell-raster-name"],
                flex: 1,
                minWidth: 200,
            },
            {
                field: "phenomTime",
                headerName: intl.formatMessage({
                    defaultMessage: "成像时间",
                    id: "dataSourceTable.columns.phenomTime",
                }),
                valueFormatter: (param: GridValueFormatterParams<Date>) => {
                    return intl.formatDate(param.value, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    });
                },
                minWidth: 150,
            },
            {
                field: "productName",
                headerName: intl.formatMessage({
                    defaultMessage: "产品名称",
                    id: "dataSourceTable.columns.productName",
                }),
                minWidth: 150,
                flex: 1,
            },
            {
                field: "productCategory",
                headerName: intl.formatMessage({
                    defaultMessage: "产品类别",
                    id: "dataSourceTable.columns.productCategory",
                }),
            },
            {
                field: "sensorType",
                headerName: intl.formatMessage({
                    defaultMessage: "传感器",
                    id: "dataSourceTable.columns.sensorType",
                }),
                description: intl.formatMessage({
                    defaultMessage: "成像所使用的传感器类型",
                    id: "dataSourceTable.columns.sensorType.descrip",
                }),
            },
            {
                field: "platformName",
                headerName: intl.formatMessage({
                    defaultMessage: "卫星",
                    id: "dataSourceTable.columns.platformName",
                }),
            },
            {
                field: "cloudage",
                headerName: intl.formatMessage({
                    defaultMessage: "云量",
                    id: "dataSourceTable.columns.cloudage",
                }),
            },
        ]) as GridColDef[]
    ).map((colDef) => ({
        align: "left",
        headerAlign: "left",
        ...colDef,
    }));
}
