/**
 * Tasks
 *
 * @author shepard
 * @date 2023/4/6
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePageSlideInTransition } from "@/hooks/transition";
import { Workflow, workflowCtx } from "@/states/workflow";
import { renderSelectedRasters } from "../../lib/renderSelectedRasters";
import { useRouter } from "next/router";
import { useCorrTasks } from "@/hooks/corrTasks";

// Components
import { Layout } from "@/components/Layout";
import { DataSourceTable } from "@/components";

// Interfaces
import { SSRProps } from "@/types";

// Stylesheet
import styles from "./Tasks.module.scss";
import { Snackbar, Alert } from "@mui/material";
import { FormattedMessage } from "react-intl";

export const getServerSideProps = renderSelectedRasters;

export const TasksPage = ({ rawSelectedRasterMeta }: SSRProps.SelectedRasters): JSX.Element => {
    const router = useRouter();

    const { updateWorkflowState, workflowState } = useContext(workflowCtx);

    const [errorMessage, setErrorMessage] = useState("");

    const mainRef = useRef<HTMLDivElement>(null);

    const { play: playSlideIn } = usePageSlideInTransition({ duration: 400 });

    // 页面进入动画
    useEffect(() => {
        if (!mainRef.current) return;
        playSlideIn(mainRef.current);
    }, [playSlideIn]);

    const { corrTasks, pending, error } = useCorrTasks(
        rawSelectedRasterMeta,
        workflowState.mode,
        1000
    );

    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const handleErrorAlertClose = useCallback(() => {
        if (error === "NotEnoughPoints") {
            router.push({ pathname: "/Picker", query: Workflow.stringify(workflowState) });
        } else if (error === "Waiting") {
            router.back();
        }
    }, [router, workflowState, error]);

    useEffect(() => {
        if (error) setShowErrorAlert(true);
        if (error === "NotEnoughPoints") setErrorMessage("同名点数量不足，正在返回上一步");
        else if (error === "Waiting") setErrorMessage("当前任务队列已满，请稍后提交处理请求");
    }, [error]);

    return (
        <Layout currentStep="MonitorTasks" className={`${styles["tasks"]}`}>
            <div className={`${styles["main"]} Flex-grow Flex-col-end`} ref={mainRef}>
                <div className="Flex-space"></div>
                <DataSourceTable
                    data={corrTasks}
                    mode="tasks"
                    toolbar={true}
                    selectionMode="none"
                    className={`${styles["data-table"]}  Flex-grow`}
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
                        id="tasks.error"
                        defaultMessage={errorMessage}
                    />
                </Alert>
            </Snackbar>
        </Layout>
    );
};

export default TasksPage;
