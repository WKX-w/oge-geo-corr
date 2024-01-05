import { MIN_CORR_POINTS, SERVICE_PREFIX } from "@/constants";
import { CorrDataState } from "@/states/corrData";
import {
    CorrMode,
    CorrectionTask,
    CorrentionTaskBandResult,
    DataSource,
    RawDataSource,
} from "@/types";
import { parseRawRasterMeta } from "@/utils";
import { useEffect, useMemo, useRef, useState } from "react";

export type ManualCorrTaskResponse = {
    status: "successful" | "failed" | "running";
    result: {
        product: Array<CorrentionTaskBandResult>;
    };
};

export type AutoCorrTaskResponse = {
    status: "successful" | "failed" | "running";
    result: {
        [id: string]: Array<CorrentionTaskBandResult>;
    };
};

const manualCorrTaskFetcher = async (raster: DataSource): Promise<ManualCorrTaskResponse> => {
    CorrDataState.initStorage(localStorage);
    const corrPoints = new CorrDataState()[raster.rasterId];
    if (corrPoints.length < MIN_CORR_POINTS)
        throw new Error("Not enough homologous points for raster " + raster.rasterId);

    const leftXArray: number[] = [],
        leftYArray: number[] = [],
        rightXArray: number[] = [],
        rightYArray: number[] = [];
    corrPoints.forEach(({ leftLat, leftLng, rightLat, rightLng }) => {
        leftXArray.push(leftLng);
        leftYArray.push(leftLat);
        rightXArray.push(rightLng);
        rightYArray.push(rightLat);
    });

    return (
        await fetch(
            `${SERVICE_PREFIX}/oge-model-service/api/correction/handcorrector/${raster.rasterId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    leftX: leftXArray,
                    leftY: leftYArray,
                    rightX: rightXArray,
                    rightY: rightYArray,
                }),
            }
        )
    ).json();
};

const autoCorrTaskFetcher = async (rasters: DataSource[]): Promise<AutoCorrTaskResponse> => {
    return (
        await fetch(`${SERVICE_PREFIX}/oge-model-service/api/correction/batch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(rasters.map((elem) => elem.rasterId)),
        })
    ).json();
};

export type CorrTasksError = undefined | "NotEnoughPoints";

export function useCorrTasks(
    rawSources: RawDataSource[],
    mode: CorrMode,
    pollingInterval?: number
): {
    corrTasks: CorrectionTask[];
    pending: boolean;
    error: CorrTasksError;
} {
    const interval = pollingInterval ?? 1000;
    const [pendingCount, setPendingCount] = useState(rawSources.length);
    const pendingCountRef = useRef(pendingCount);
    pendingCountRef.current = pendingCount;

    const [errorState, setErrorState] = useState<CorrTasksError>(undefined);

    const { pendingStatuses, taskIdMap, tasks } = useMemo(() => {
        setPendingCount(rawSources.length);
        const taskIdMap = new Map<number, number>();
        const tasks: CorrectionTask[] = rawSources.map((elem, idx) => {
            taskIdMap.set(elem.rasterId, idx);
            return {
                ...parseRawRasterMeta(elem),
                status: "running",
                result: [],
            };
        });
        const pendingStatuses: boolean[] =
            mode === "manual" ? Array(rawSources.length).fill(true) : [];

        return { tasks, taskIdMap, pendingStatuses };
    }, [rawSources, mode]);

    useEffect(() => {
        const timer = setInterval(async () => {
            if (mode === "auto") {
                if (pendingCountRef.current === 0) return;
                
                const { result: batchResult, status } = await autoCorrTaskFetcher(tasks);
                if (status !== "running") setPendingCount(0);

                if (status === "failed") {
                    tasks.forEach((elem) => {
                        elem.status = "failed";
                    });
                } else if (status === "successful") {
                    for (const rasterIdKey in batchResult) {
                        const task = tasks[taskIdMap.get(Number(rasterIdKey)) as number];
                        task.result = batchResult[rasterIdKey];
                        task.status = "success";
                    }
                }
            } else if (
                mode === "manual" &&
                pendingStatuses.length > 0 &&
                pendingCountRef.current > 0
            ) {
                const idx = tasks.length - pendingCountRef.current;

                if (pendingStatuses[idx] === false) return;

                const task = tasks[idx];

                let manualCorrTaskRes: ManualCorrTaskResponse | undefined = undefined;
                try {
                    manualCorrTaskRes = await manualCorrTaskFetcher(task);
                } catch {
                    setErrorState("NotEnoughPoints");
                }

                if (manualCorrTaskRes) {
                    const { result, status } = manualCorrTaskRes;

                    if (status !== "running") {
                        pendingStatuses[idx] = false;
                        setPendingCount((state) => state - 1);
                    }

                    if (status === "failed") {
                        task.status = "failed";
                    } else if (status === "successful") {
                        task.status = "success";
                        task.result = result.product;
                    }
                }
            }
        }, interval);

        return () => clearInterval(timer);
    }, [tasks, interval, mode]);

    return {
        corrTasks: tasks,
        pending: pendingCount !== 0,
        error: errorState,
    };
}
