/**
 * HomoPointsTable
 *
 * @author shepard
 * @date 2023/3/24
 */

import { RasterCorrData } from "@/types";
import {
    Paper,
    TableContainer,
    TableContainerProps,
    Table,
    TableCell,
    TableHead,
    TableBody,
    TableRow,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { renderCoordinate, tableHeaders } from "./HomoPointsTable.data";

// ----- Components ----- //
import IconDelete from "@mui/icons-material/Delete";

// ----- Interfaces ----- //

// ----- Stylesheet ----- //
import styles from "./HomoPointsTable.module.scss";
import { createCorrPoint } from "@/states/corrData";

export const HomoPointsTable = ({
    className = "",
    points,
    pointer,
    currentIdRef,
    onPointerChange,
    onDeletePoint,
    ...otherProps
}: HomoPointsTable.Props): JSX.Element => {
    const lastLengthRef = useRef((points ?? []).length);

    const containerRef = useRef<HTMLDivElement>(null);

    const appendedPoints: RasterCorrData = useMemo(() => {
        return points.concat([
            createCorrPoint({ id: points.length === 0 ? 0 : points[points.length - 1].id + 1 }),
        ]);
    }, [points]);

    if (currentIdRef) currentIdRef.current = appendedPoints[pointer ?? 0].id;

    useEffect(() => {
        if (points.length > lastLengthRef.current) {
            const container = containerRef.current;
            if (!container) return;
            container.scrollTo({ top: container.scrollHeight });
            lastLengthRef.current = points.length;
        }
    }, [points]);

    const [{ idx: hoverIdx, side: hoverSide }, setCurrentHover] = useState<{
        idx: number;
        side: "left" | "right";
    }>({ idx: -1, side: "left" });

    const handleMouseEnterCell = useCallback((idx: number, side: "left" | "right") => {
        setCurrentHover({ idx, side });
    }, []);

    const handleMouseLeaveCell = useCallback(() => {
        setCurrentHover({ idx: -1, side: "left" });
    }, []);

    const handleClickCell = useCallback(
        (idx: number) => {
            if (!onPointerChange) return;
            onPointerChange(idx);
        },
        [onPointerChange]
    );

    return (
        <TableContainer
            component={Paper}
            className={`${styles["homo-points-table"]} ${className} `}
            ref={containerRef}
            {...otherProps}
        >
            <Table className={`${styles["table"]} `} size="small">
                <TableHead className={`${styles["head"]} `}>
                    {tableHeaders.map((row, idx) => (
                        <TableRow key={idx}>
                            {row.map(({ align, msg, colSpan, rowSpan }, idx) => (
                                <TableCell
                                    key={idx}
                                    className={`${styles["table-header-cell"]} `}
                                    align={align}
                                    rowSpan={rowSpan}
                                    colSpan={colSpan}
                                >
                                    {msg}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableHead>
                <TableBody>
                    {appendedPoints.map(({ id, leftLat, leftLng, rightLng, rightLat }, idx) => (
                        <TableRow key={id} className={`${styles["body-row"]} `}>
                            <TableCell className={`${styles["cell-delete"]} `} align="center">
                                {idx !== appendedPoints.length - 1 ? (
                                    <IconDelete
                                        onClick={() => {
                                            console.log("deleting");
                                            if (onDeletePoint) onDeletePoint(idx);
                                        }}
                                    />
                                ) : null}
                            </TableCell>
                            <TableCell className={`${styles["cell-id"]} `} align="center">
                                <div className={`${styles["cell-content-id"]} `}>{id}</div>
                            </TableCell>
                            <TableCell align="center" className={`${styles["cell-lng"]} `}>
                                <div
                                    className={`${styles["cell-content-lng"]} `}
                                    onMouseEnter={() => handleMouseEnterCell(idx, "left")}
                                    onMouseLeave={handleMouseLeaveCell}
                                    onClick={() => handleClickCell(idx)}
                                    data-selected={pointer === idx}
                                    data-hover={hoverIdx === idx && hoverSide === "left"}
                                >
                                    {renderCoordinate(leftLng)}
                                </div>
                            </TableCell>
                            <TableCell align="center" className={`${styles["cell-lat"]} `}>
                                <div
                                    className={`${styles["cell-content-lat"]} `}
                                    onMouseEnter={() => handleMouseEnterCell(idx, "left")}
                                    onMouseLeave={handleMouseLeaveCell}
                                    onClick={() => handleClickCell(idx)}
                                    data-selected={pointer === idx}
                                    data-hover={hoverIdx === idx && hoverSide === "left"}
                                >
                                    {renderCoordinate(leftLat)}
                                </div>
                            </TableCell>
                            <TableCell align="center" className={`${styles["cell-lng"]} `}>
                                <div
                                    className={`${styles["cell-content-lng"]} `}
                                    onMouseEnter={() => handleMouseEnterCell(idx, "right")}
                                    onMouseLeave={handleMouseLeaveCell}
                                    onClick={() => handleClickCell(idx)}
                                    data-selected={pointer === idx}
                                    data-hover={hoverIdx === idx && hoverSide === "right"}
                                >
                                    {renderCoordinate(rightLng)}
                                </div>
                            </TableCell>
                            <TableCell align="center" className={`${styles["cell-lat"]} `}>
                                <div
                                    className={`${styles["cell-content-lat"]} `}
                                    onMouseEnter={() => handleMouseEnterCell(idx, "right")}
                                    onMouseLeave={handleMouseLeaveCell}
                                    onClick={() => handleClickCell(idx)}
                                    data-selected={pointer === idx}
                                    data-hover={hoverIdx === idx && hoverSide === "right"}
                                >
                                    {renderCoordinate(rightLat)}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

HomoPointsTable.displayName = "HomoPointsTable";

// eslint-disable-next-line
export namespace HomoPointsTable {
    export interface Props extends Omit<TableContainerProps, "ref"> {
        points: RasterCorrData;
        pointer?: number;
        onPointerChange?: (pointer: number) => void;
        onDeletePoint?: (idx: number) => void;
        // This ref will be updated when points and pointer props change.
        currentIdRef?: React.MutableRefObject<number>;
    }
}
