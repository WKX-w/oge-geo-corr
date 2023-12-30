import "@/styles/global.scss";
import "leaflet/dist/leaflet.css";
import type { AppProps } from "next/app";
import { IntlProvider, MessageFormatElement } from "react-intl";
import { useRouter } from "next/router";
import { Workflow, workflowCtx, workflowPureStateInit } from "@/states/workflow";

import en_US from "@/i18n/compiled/en-US.json";
import zh_CN from "@/i18n/compiled/zh-CN.json";
import { useCallback, useEffect, useRef, useState } from "react";
import { WorkflowPureState, WorkflowStateSetter } from "@/types";
import { SWRConfig } from "swr/_internal";

const localeMessages: Record<string, Record<string, MessageFormatElement[]>> = {
    "en-US": en_US,
    "zh-CN": zh_CN,
};

console.warn(
    "This tool is built for the Open Geospatial Engine based on Next.js, React and many other open source libraries. The Points Picker Tool is created with the Leaflet project that was created 11 years ago by Volodymyr Agafonkin, a Ukrainian citizen living in Kyiv. If you are interested in the Leaflet project, please visit https://leafletjs.com/."
);

export default function App({ Component, pageProps }: AppProps) {
    const { locale = process.env.NEXT_PUBLIC_DEF_LOCALE as string, query } = useRouter();

    const [workflowPureState, setWorkflowPureState] =
        useState<WorkflowPureState>(workflowPureStateInit);

    const initRef = useRef(false);

    // Runs after the initial render and initialize the workflowstate according to page query
    useEffect(() => {
        if (initRef.current) return;
        setWorkflowPureState(() => {
            const initState = Workflow.dispatch(Workflow.parseQueryString(location.search));
            console.log("init workflow state", initState, "routerQuery:", location.search);
            initRef.current = true;
            Workflow.replaceState(initState, "Initialization");
            return initState;
        });
    }, []);

    const updateWorkflowState = useCallback<WorkflowStateSetter>(async (action, reason) => {
        return new Promise((resolve) => {
            setWorkflowPureState((state) => {
                if (initRef.current === false) {
                    console.warn(
                        "Query state is not initialized. The attempt to update workflow state before initialization will be ignored."
                    );
                    resolve(state);
                    return state;
                }
                const newState = Workflow.dispatch(state, action);
                Workflow.replaceState(newState, reason);
                // For debug
                Workflow.printLatestChanges(3);
                resolve(newState);
                return newState;
            });
        });
    }, []);

    return (
        <IntlProvider locale={locale} messages={localeMessages[locale]} defaultLocale="zh-CN">
            <workflowCtx.Provider
                value={{
                    workflowState: workflowPureState,
                    updateWorkflowState,
                }}
            >
                <SWRConfig
                    value={{
                        revalidateOnFocus: false,
                        revalidateIfStale: false,
                        revalidateOnReconnect: false,
                        revalidateOnMount: false,
                    }}
                >
                    <Component {...pageProps} />
                </SWRConfig>
            </workflowCtx.Provider>
        </IntlProvider>
    );
}
