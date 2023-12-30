import { NO_DATA } from "@/constants";
import { TableCellProps } from "@mui/material";
import { FormattedMessage } from "react-intl";

type TableHeader = {
    align: TableCellProps["align"];
    msg: React.ReactNode;
    rowSpan?: number;
    colSpan?: number;
};

export const tableHeaders: TableHeader[][] = [
    [
        { align: "center", msg: null, rowSpan: 2 },
        {
            align: "center",
            msg: <FormattedMessage id="homoPointsTable.head.id" defaultMessage="序号" />,
            rowSpan: 2,
        },
        {
            align: "center",
            msg: (
                <FormattedMessage
                    id="homoPointsTable.head.coorOnOriImg"
                    defaultMessage="待配准影像坐标"
                />
            ),
            colSpan: 2,
        },
        {
            align: "center",
            msg: (
                <FormattedMessage
                    id="homoPointsTable.head.coorOnRefImg"
                    defaultMessage="参考影像坐标"
                />
            ),
            colSpan: 2,
        },
    ],
    [
        {
            align: "center",
            msg: <FormattedMessage id="homoPointsTable.head.longitude" defaultMessage="经度" />,
        },
        {
            align: "center",
            msg: <FormattedMessage id="homoPointsTable.head.latitude" defaultMessage="纬度" />,
        },
        {
            align: "center",
            msg: <FormattedMessage id="homoPointsTable.head.longitude" defaultMessage="经度" />,
        },
        {
            align: "center",
            msg: <FormattedMessage id="homoPointsTable.head.latitude" defaultMessage="纬度" />,
        },
    ],
];

export const renderCoordinate = (value: number) =>
    value === NO_DATA ? "\u00A0" : value.toFixed(8);
