import {
    CorrMode,
    CorrQuery,
    WorkflowPureState,
    WorkflowState,
    WorkflowStateSetter,
} from "@/types";
import { merge } from "@/utils";
import { cloneDeep } from "lodash";
import Router from "next/router";
import { createContext } from "react";

const MAX_STATE_CHANGES_ENTRIES = Number(process.env.NEXT_PUBLIC_MAX_STATE_ENTRIES);
const MAX_DATA_SOURCE_LENGTH = Number(process.env.NEXT_PUBLIC_MAX_DATA_SOURCE_LENGTH);
export namespace Workflow {
    function __parseList(param: string | string[] | undefined): number[] {
        if (Array.isArray(param)) return [];

        return typeof param === "string" && param.length > 0
            ? param
                  .split(",")
                  .map((v) => {
                      return Number(v);
                  })
                  .filter((v) => Number.isNaN(v) === false)
            : [];
    }

    function validateMode(mode: unknown): CorrMode {
        if ((["auto", "manual", "default"] as CorrMode[]).includes(mode as any) === false)
            return "default";
        return mode as CorrMode;
    }

    export function parseQuery({
        "oge-retrieved-ids": rawOgeRetrievedIds,
        "raster-ids": rawRasterIds,
        "selected-ids": rawSelectedIds,
        mode,
    }: Partial<CorrQuery>): WorkflowState {
        return {
            mode: validateMode(mode),
            ogeRetrievedIds: __parseList(rawOgeRetrievedIds),
            rasterIds: __parseList(rawRasterIds),
            selectedIds: __parseList(rawSelectedIds),
        };
    }

    export function parseQueryString(query: string) {
        return parseQuery(Object.fromEntries(new URLSearchParams(query).entries()));
    }

    export function dispatch<T extends WorkflowPureState | WorkflowState>(
        current: T,
        action?: Partial<WorkflowPureState>
    ): WorkflowPureState {
        const { rasterIds, mode, selectedIds } = current;

        const ogeRetrievedIds = "ogeRetrievedIds" in current ? current.ogeRetrievedIds : [];

        const newRasterIds =
            action?.rasterIds !== undefined
                ? action.rasterIds
                : merge(rasterIds, ogeRetrievedIds).slice(0, MAX_DATA_SOURCE_LENGTH);

        const newSelectedIds = action?.selectedIds ?? selectedIds.slice(0, MAX_DATA_SOURCE_LENGTH);

        const newState = {
            rasterIds: newRasterIds,
            mode,
            selectedIds: newSelectedIds,
            ...action,
        };

        return newState;
    }

    const stateKey2QueryParamName: Record<keyof WorkflowPureState, keyof CorrQuery> = {
        mode: "mode",
        rasterIds: "raster-ids",
        selectedIds: "selected-ids",
    };

    // 清除为undefined、空字符串或空数组的属性，返回新对象（深拷贝）
    function removeEmptyProps<T extends Object>(o: T) {
        const cleaned = cloneDeep(o);
        for (const key in cleaned) {
            const prop = cleaned[key];

            if (
                prop === undefined ||
                (typeof prop === "string" && prop.length === 0) ||
                (Array.isArray(prop) && prop.length === 0)
            )
                delete cleaned[key];
        }
        return cleaned;
    }

    export function stringify(state: WorkflowPureState): string {
        const cleanState = removeEmptyProps(state);

        const renamedState = Object.fromEntries(
            Object.entries(cleanState).map((entry) => [
                stateKey2QueryParamName[entry[0] as keyof typeof cleanState],
                entry[1],
            ])
        );
        return new URLSearchParams(renamedState as any).toString();
    }

    let stateChangeHistory: {
        reason: string | undefined;
        state: WorkflowPureState;
        time: string;
        search: string;
    }[] = [];

    (function initHistory() {
        const window = global.window;
        if (!window) return;

        const __changeHistoryKey = "workflowStateChangeHistory";

        stateChangeHistory = JSON.parse(localStorage.getItem(__changeHistoryKey) ?? "[]");

        window.addEventListener("beforeunload", (ev) => {
            localStorage.setItem(__changeHistoryKey, JSON.stringify(stateChangeHistory));
        });
    })();

    // Prevent the state being pushed twice.
    let lastUrl = "",
        lastReason = "";

    /**
     * Replace the state of browser history and keep a record for debugging
     * @param state
     * @param reason
     * @returns the unmodified state passed as the first argument
     */
    export function replaceState(state: WorkflowPureState, reason?: string): void {
        const serializedState = Workflow.stringify(state);

        Router.replace({ query: serializedState }, undefined, { shallow: true });

        if (lastUrl === document.URL && lastReason === reason) return;

        stateChangeHistory.push({
            reason,
            state,
            time: new Date().toISOString(),
            search: serializedState,
        });

        if (stateChangeHistory.length > MAX_STATE_CHANGES_ENTRIES) {
            const start = stateChangeHistory.length - MAX_STATE_CHANGES_ENTRIES;
            stateChangeHistory = stateChangeHistory.slice(
                start > 0 ? start : 0,
                stateChangeHistory.length
            );
        }

        lastUrl = location.href;
        lastReason = reason || "";
    }

    export function printLatestChanges(count?: number) {
        const __defaultEntriesCount = 5;

        console.log(
            `--- Printing workflow state change history(${
                count ?? __defaultEntriesCount
            } entries) ---`
        );

        const oldest = stateChangeHistory.length - (count ?? __defaultEntriesCount);
        for (let idx = oldest; idx < stateChangeHistory.length; ++idx) {
            const { reason, state, time, search: url } = stateChangeHistory[idx] ?? {};
            console.log(
                `${idx}. [${new Date(time).toLocaleTimeString()}] ${reason || ""} query: ${url}`,
                state
            );
        }
        console.log(`--- End ---`);
    }
}

export const workflowPureStateInit: WorkflowPureState = {
    mode: "default",
    rasterIds: [],
    selectedIds: [],
};

export const workflowCtx = createContext<{
    workflowState: WorkflowPureState;
    updateWorkflowState: WorkflowStateSetter;
}>({
    workflowState: workflowPureStateInit,
    updateWorkflowState: () => ({} as any),
});
workflowCtx.displayName = "workflowContext";
