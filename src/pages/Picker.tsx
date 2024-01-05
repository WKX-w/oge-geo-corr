/**
 * Picker
 *
 * @author shepard
 * @date 2023/3/23
 */
import { usePageSlideInTransition, usePageSlideOutTransition } from "@/hooks/transition";
import React, { useCallback, useContext, useEffect, useRef, useState, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Workflow, workflowCtx } from "@/states/workflow";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { CorrDataState, createCorrPoint } from "@/states/corrData";
import { computeRasterCenter, deriveFromCorrData, validate } from "../pageData/Picker.data";
import { NO_DATA } from "@/constants";
import { useLocalStorage } from "@/hooks/storage";
import { useTileSource } from "@/hooks/tileSource";

import { parseRawRasterMeta } from "@/utils";
import { isEqual } from "lodash";
import { renderSelectedRasters } from "../../lib/renderSelectedRasters";

// Components
import { DataSourceTable, HomoPointsTable, Layout, PickerToolbox } from "@/components";
import Head from "next/head";
import { Alert, Button, Collapse, Snackbar, Tooltip } from "@mui/material";
import IconExpandMore from "@mui/icons-material/ExpandMore";
import IconFold from "@mui/icons-material/Remove";
import { PickerMap } from "@/components";

// Interfaces
import { CorrPoint, DataSource, RawDataSource, SSRProps } from "@/types";
import { Certain } from "@/types/utils";
import { LatLngLiteral } from "leaflet";

// Stylesheet
import styles from "./Picker.module.scss";

export const getServerSideProps: GetServerSideProps<SSRProps.SelectedRasters> =
    renderSelectedRasters;

const Picker = ({ rawSelectedRasterMeta }: PickerPageProps): JSX.Element => {
    const { push } = useRouter();
    const intl = useIntl();

    const mainRef = useRef<HTMLDivElement>(null);
    const { play: playSlideIn } = usePageSlideInTransition();
    useEffect(() => {
        if (mainRef.current) playSlideIn(mainRef.current);
    }, []); // eslint-disable-line

    const { workflowState } = useContext(workflowCtx);

    const [toolboxStates, setToolboxStates] = useState<PickerToolbox.ToolButtonStates>({
        linked: true,
        fullscreen: false,
        addPoint: void 0,
        locateView: void 0,
    });

    const [pickerMapResizeTrigger, setPickerMapResizeTrigger] = useState({});

    const handleViewportChange = useCallback<Certain<PickerMap.Props["onViewportChange"]>>(
        (vp) => {
            if (toolboxStates.linked) setViewport(vp);
            currentViewportRef.current = vp;
        },
        [toolboxStates]
    );

    const rasterMeta = useMemo(
        () =>
            new Map(rawSelectedRasterMeta.map((elem) => [elem.rasterId, parseRawRasterMeta(elem)])),
        [rawSelectedRasterMeta]
    );

    const [currentRasterId, setCurrentRasterId] = useState<number>(rasterMeta.keys().next().value);
    const memoCurRasterId = useMemo(() => [currentRasterId], [currentRasterId]);

    const rasterDefaultViewPort: PickerMap.Viewport = useMemo(
        () => ({
            center: computeRasterCenter(rasterMeta.get(currentRasterId) as DataSource),
            zoom: 9,
        }),
        [rasterMeta, currentRasterId]
    );
    const [viewport, setViewport] = useState<PickerMap.Viewport>(rasterDefaultViewPort);

    // 最后一次用户操作修改的viewport，可能来自于两个影像选点视窗之一。
    const currentViewportRef = useRef<PickerMap.Viewport>(viewport);

    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const { tileSources } = useTileSource(
        rasterMeta.get(currentRasterId) as DataSource,
        500,
        () => {
            requestIdleCallback(() => {
                console.log("Datasource WMTS URL request failed");
                setShowErrorAlert(true);
            });
        }
    );

    const handleCurrentImageChange = useCallback<
        Certain<DataSourceTable.Props["onSelectionChange"]>
    >(
        (currentIds) => {
            if (currentIds.length === 0) {
                setShowErrorAlert(true);
            } else {
                setCurrentPointer(0);
                setCurrentRasterId((state) =>
                    isEqual(state, [currentIds[0]]) ? state : currentIds[0]
                );
                setViewport({
                    center: computeRasterCenter(rasterMeta.get(currentIds[0]) as DataSource),
                    zoom: 9,
                });
            }
        },
        [rasterMeta]
    );

    const handleErrorAlertClose = useCallback(() => {
        push({ pathname: "/DataSource", query: Workflow.stringify(workflowState) });
    }, [push, workflowState]);

    const [dataSourceTableExpanded, setDataSourceTableExpanded] = useState(false);

    const [corrData, setCorrData] = useState<CorrDataState>(new CorrDataState());

    const { leftPoints, rightPoints } = useMemo(
        () => deriveFromCorrData(corrData[currentRasterId]),
        [corrData, currentRasterId]
    );

    const [currentPointer, setCurrentPointer] = useState(0);

    const handlePickPoint = useCallback(
        (pos: LatLngLiteral, side: "left" | "right") => {
            setCorrData((state) => {
                const newCorrData = state[currentRasterId].concat();

                setCurrentPointer((ptr) => {
                    let newPtr = ptr;

                    const lngProp = (side + "Lng") as keyof CorrPoint,
                        latProp = (side + "Lat") as keyof CorrPoint;

                    if (newCorrData.length === ptr) {
                        const newPtId =
                            newCorrData.length === 0
                                ? 0
                                : newCorrData[newCorrData.length - 1].id + 1;
                        newCorrData.push(
                            createCorrPoint({ id: newPtId, [latProp]: pos.lat, [lngProp]: pos.lng })
                        );
                    } else {
                        const pt = (newCorrData[ptr] = {
                            ...newCorrData[ptr],
                            [latProp]: pos.lat,
                            [lngProp]: pos.lng,
                        });
                        if (
                            newCorrData.length === ptr + 1 &&
                            pt.leftLat !== NO_DATA &&
                            pt.rightLat !== NO_DATA
                        ) {
                            ++newPtr;
                        }
                    }

                    return newPtr;
                });

                return new CorrDataState(state, {
                    rasterId: currentRasterId,
                    data: newCorrData,
                });
            });
        },
        [currentRasterId]
    );

    const handleToolboxStateChange = useCallback<Certain<PickerToolbox.Props["onStateChange"]>>(
        (which, current) => {
            setToolboxStates(current);
            switch (which) {
                case "addPoint":
                    setCurrentPointer(corrData[currentRasterId].length);
                    break;
                case "fullscreen":
                    setPickerMapResizeTrigger({});
                    break;
                case "linked":
                    if (current.linked === true) setViewport(currentViewportRef.current);
                    break;
                case "locateView":
                    setViewport(rasterDefaultViewPort);
                    break;
            }
        },
        [corrData, currentRasterId, rasterDefaultViewPort]
    );

    const handlePointerChange = useCallback<Certain<HomoPointsTable.Props["onPointerChange"]>>(
        (ptr) => {
            setCurrentPointer(ptr);
        },
        []
    );

    const handleDeletePointFromTable = useCallback<Certain<HomoPointsTable.Props["onDeletePoint"]>>(
        (idx) => {
            setCorrData((state) => {
                const newCorrData = state[currentRasterId].concat();
                newCorrData.splice(idx, 1);
                const newState = new CorrDataState(state, {
                    rasterId: currentRasterId,
                    data: newCorrData,
                });
                return newState;
            });
            setCurrentPointer((ptr) => {
                function movePtr(ptr: number, deleted: number): number {
                    if (ptr < deleted) return ptr;
                    else if (ptr === 0) return 0;
                    else return ptr - 1;
                }
                return movePtr(ptr, idx);
            });
        },
        [currentRasterId]
    );

    useLocalStorage((storage) => {
        CorrDataState.initStorage(storage);
        setCorrData((state) => new CorrDataState(state));
    });

    const currentPointIdRef = useRef(0);

    const { message: submitTooltip, canGoNext } = validate(rasterMeta, corrData);

    const { play: playSlideOut } = usePageSlideOutTransition();
    const handleSubmitTasks = useCallback(async () => {
        if (!canGoNext) return;
        if (mainRef.current) await playSlideOut(mainRef.current);
        push({
            pathname: "/Tasks",
            query: Workflow.stringify(workflowState),
        });
    }, [canGoNext, playSlideOut, push, workflowState]);

    return (
        <Layout currentStep="MatchHomoPoints" className={`${styles["picker"]}`}>
            <Head>
                <title>
                    {intl.formatMessage({
                        id: "picker.title",
                        defaultMessage: "几何校正：匹配同名点",
                    })}
                </title>
            </Head>
            <div
                className={`${styles["main"]} Transparent Flex-grow`}
                ref={mainRef}
                data-fullscreen={toolboxStates.fullscreen}
            >
                <div className={`${styles["tables"]} Flex-col`}>
                    <Button
                        className={`${styles["expand-table-btn"]} `}
                        variant="outlined"
                        onClick={() => setDataSourceTableExpanded(!dataSourceTableExpanded)}
                    >
                        <span>
                            <FormattedMessage
                                id="picker.tables.showDataSourceTable"
                                defaultMessage="待配准影像列表"
                            />
                        </span>
                        {dataSourceTableExpanded ? <IconFold /> : <IconExpandMore />}
                    </Button>
                    <Collapse
                        in={dataSourceTableExpanded}
                        className={`${styles["data-source-table-collapse"]} `}
                    >
                        <DataSourceTable
                            mode="data"
                            className={`${styles["data-source-table"]} `}
                            data={Array.from(rasterMeta.values())}
                            selectedData={memoCurRasterId}
                            selectionMode="single-row"
                            toolbar={false}
                            hideFooterRowCount={true}
                            onSelectionChange={handleCurrentImageChange}
                        />
                    </Collapse>
                    <HomoPointsTable
                        className={`${styles["homo-points-table"]} Flex-grow`}
                        points={corrData[currentRasterId]}
                        pointer={currentPointer}
                        currentIdRef={currentPointIdRef}
                        onDeletePoint={handleDeletePointFromTable}
                        onPointerChange={handlePointerChange}
                    />
                    <div className={`${styles["footer"]} Flex-end`}>
                        <Tooltip title={submitTooltip} placement="top">
                            <Button
                                data-enabled={canGoNext}
                                variant="outlined"
                                onClick={handleSubmitTasks}
                            >
                                <FormattedMessage
                                    id="picker.footer.button"
                                    defaultMessage="提交配准任务"
                                />
                            </Button>
                        </Tooltip>
                    </div>
                </div>

                <PickerToolbox
                    className={`${styles["toolbox"]} `}
                    states={toolboxStates}
                    getCurrentPointId={() => currentPointIdRef.current.toString()}
                    onStateChange={handleToolboxStateChange}
                />
                <PickerMap
                    className={`${styles["picker-map"]} ${styles["picker-ori-img"]}`}
                    showLoading={tileSources.left.loading}
                    tileSource={tileSources.left.url}
                    zoom={viewport.zoom}
                    center={viewport.center}
                    points={leftPoints}
                    onAppendPoint={(pos) => handlePickPoint(pos, "left")}
                    onViewportChange={handleViewportChange}
                    resizeTrigger={pickerMapResizeTrigger}
                    attribName={intl.formatMessage({
                        defaultMessage: "待配准影像",
                        id: "picker.pickerMap.oriImg",
                    })}
                />
                <PickerMap
                    className={`${styles["picker-map"]} ${styles["picker-ref-img"]}`}
                    // showLoading={tileSources.right.loading}
                    showLoading={false}
                    // tileSource={tileSources.right.url}
                    tileSource={undefined}
                    zoom={viewport.zoom}
                    center={viewport.center}
                    points={rightPoints}
                    onAppendPoint={(pos) => handlePickPoint(pos, "right")}
                    onViewportChange={handleViewportChange}
                    resizeTrigger={pickerMapResizeTrigger}
                    attribName={intl.formatMessage({
                        defaultMessage: "参考影像",
                        id: "picker.pickerMap.refImg",
                    })}
                />
            </div>
            <Snackbar
                open={showErrorAlert}
                anchorOrigin={{ horizontal: "center", vertical: "top" }}
                autoHideDuration={2000}
                onClose={handleErrorAlertClose}
            >
                <Alert severity="error">
                    <FormattedMessage
                        id="picker.error.dataSource"
                        defaultMessage="数据源错误，正在返回上一步"
                    />
                </Alert>
            </Snackbar>
        </Layout>
    );
};

export default Picker;

type PickerPageProps = {
    rawSelectedRasterMeta: RawDataSource[];
};
