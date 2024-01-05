/**
 * DataSource
 *
 * @author shepard
 * @date 2023/3/18
 */
import { useRouter } from "next/router";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePageSlideInTransition, usePageSlideOutTransition } from "@/hooks/transition";
import { Workflow, workflowCtx } from "@/states/workflow";
import { getRasterMetadataByImageId } from "../../lib/getRasterMetadataByImageId";

// Components
import { FormattedMessage, useIntl } from "react-intl";
import { DataSourceTable, Layout } from "@/components";
import Head from "next/head";
import { Alert, Button, Snackbar } from "@mui/material";
import IconArrowRight from "@mui/icons-material/ArrowRight";
// import IconInfo from "@mui/icons-material/InfoOutlined";

// Interfaces
import { GetServerSideProps } from "next";
import { Certain } from "@/types/utils";
import { DataSourceStatus, RawDataSource } from "@/types/";

// Stylesheet
import styles from "./DataSource.module.scss";
// import { validateState } from "../pageData/DataSource.data";
import { parseRawRasterMeta } from "@/utils";
// import { useTileSource, useTileSourceValidation } from "@/hooks/tileSource";

export const getServerSideProps: GetServerSideProps = async (context) => {
    const rawState = Workflow.parseQuery(context.query);
    const { rasterIds } = Workflow.dispatch(rawState);
    const rawRasterMeta = await getRasterMetadataByImageId(rasterIds);
    return {
        props: {
            lengthExceeded:
                rawState.ogeRetrievedIds.length + rawState.rasterIds.length >
                Number(process.env.NEXT_PUBLIC_MAX_DATA_SOURCE_LENGTH),
            rawRasterMeta,
        },
    };
};

export const DataSourcePage = ({
    lengthExceeded,
    rawRasterMeta,
}: DataSourcePageProps): JSX.Element => {
    const intl = useIntl();
    const { push } = useRouter();

    const { updateWorkflowState, workflowState } = useContext(workflowCtx);

    const mainRef = useRef<HTMLDivElement>(null);

    const { play: playSlideIn } = usePageSlideInTransition({ duration: 400 });

    // 页面进入动画
    useEffect(() => {
        if (!mainRef.current) return;
        playSlideIn(mainRef.current);
    }, [playSlideIn]);

    // 清除当前选中状态
    useEffect(() => {
        updateWorkflowState({ selectedIds: [] });
    }, [updateWorkflowState]);

    // 数据量超限提示
    const [showDataLenAlert, setShowDataLenAlert] = useState(false);
    useEffect(() => {
        if (lengthExceeded) {
            setShowDataLenAlert(true);
        }
    }, [lengthExceeded]);

    const handleLinkToOge = useCallback(() => {
        location.href = `http://${
            process.env.NEXT_PUBLIC_OGE_HOST
        }/advancedRetrieval?type=dataset&from=${encodeURIComponent(document.URL)}`;
    }, []);

    const handleDataChange = useCallback<Certain<DataSourceTable.Props<"data">["onDataChange"]>>(
        (data) => {
            updateWorkflowState(
                { rasterIds: data.map((elem) => elem.rasterId) },
                "User deletes data source rows."
            );
        },
        [updateWorkflowState]
    );

    const handleSelectionChange = useCallback<
        Certain<DataSourceTable.Props<"data">["onSelectionChange"]>
    >(
        (selectedRows) => {
            updateWorkflowState({ selectedIds: selectedRows }, "User selection changed.");
        },
        [updateWorkflowState]
    );

    const { play: playSlideOut } = usePageSlideOutTransition();

    const handleConfirmSelection = useCallback(async () => {
        if (mainRef.current) await playSlideOut(mainRef.current);
        push({
            pathname: workflowState.mode === "manual" ? "/Picker" : "/Tasks",
            query: Workflow.stringify(workflowState),
        });
    }, [workflowState, push, playSlideOut]);

    // Used on "manual" correction mode
    // const { rasterMetaStatuses, pending } = useTileSourceValidation(
    //     workflowState.mode === "manual" ? rawRasterMeta : undefined,
    //     1000
    // );

    // Used on "auto" correction mode
    const rasterMeta = useMemo(() => {
        // if (workflowState.mode === "auto")
        return rawRasterMeta.map((elem) => {return {...parseRawRasterMeta(elem), pending: false, available: true} as DataSourceStatus});
        // return [];
    }, [workflowState.mode, rawRasterMeta]);

    // const { message, canGoNext } = useMemo(
    //     () => validateState(workflowState, pending),
    //     [workflowState, pending]
    // );

    return (
        <Layout currentStep="LinkDataSource" className={`${styles["data-source"]} `}>
            <Head>
                <title>
                    {intl.formatMessage({
                        id: "dataSource.title",
                        defaultMessage: "几何校正：选择数据源",
                    })}
                </title>
            </Head>
            <div
                className={`${styles["main"]} Transparent Flex-grow Flex-col-end-start`}
                ref={mainRef}
            >
                <div onClick={handleLinkToOge} className={`${styles["link-to-oge"]} Flex`}>
                    <span>
                        <FormattedMessage
                            defaultMessage="前往OGE数据中心检索数据"
                            id="dataSource.toOge"
                        />
                    </span>
                    <IconArrowRight />
                </div>
                <DataSourceTable
                    mode={workflowState.mode === "manual" ? "status" : "data"}
                    toolbar={true}
                    selectionMode="checkbox"
                    className={`${styles["data-table"]} `}
                    // data={workflowState.mode === "manual" ? rasterMetaStatuses : rasterMeta}
                    data={rasterMeta}
                    selectedData={workflowState.selectedIds}
                    onDataChange={handleDataChange}
                    onSelectionChange={handleSelectionChange}
                />
                <div className={`${styles["footer"]} Flex-end-end`}>
                    {/* {canGoNext === false ? (
                        <p className={`Flex-center`}>
                            <IconInfo />
                            <span>{message}</span>
                        </p>
                    ) : null} */}
                    <Button
                        // variant={canGoNext ? "contained" : "outlined"}
                        // data-enabled={canGoNext}
                        onClick={handleConfirmSelection}
                    >
                        <FormattedMessage
                            id="dataSource.footer.confirm"
                            defaultMessage="确认选择"
                        />
                    </Button>
                </div>
            </div>
            <Snackbar
                open={showDataLenAlert}
                autoHideDuration={2000}
                anchorOrigin={{ horizontal: "center", vertical: "top" }}
                onClose={() => setShowDataLenAlert(false)}
            >
                <Alert severity="warning">
                    <FormattedMessage
                        id="dataSource.alert.dataLenExceeded"
                        defaultMessage="您链接了超过 {maxLen} 条数据源，超过部分已被舍弃。"
                        values={{
                            maxLen: process.env.NEXT_PUBLIC_MAX_DATA_SOURCE_LENGTH,
                        }}
                    />
                </Alert>
            </Snackbar>
        </Layout>
    );
};

export default DataSourcePage;

type DataSourcePageProps = {
    lengthExceeded: boolean;
    rawRasterMeta: RawDataSource[];
};
