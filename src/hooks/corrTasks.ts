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

const manualCorrTaskJobFetcher = async (raster: DataSource): Promise<any> => {
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
            `${SERVICE_PREFIX}/oge-model-service/api/correction/handCorrector/${raster.rasterId}/execute`,
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

const manualCorrTaskFetcher = async (jobId: string) => {
    return (
        await fetch(
            `${SERVICE_PREFIX}/oge-model-service/api/correction/handCorrector/${jobId}`
        )
    ).json();
}

const autoCorrTaskJobFetcher = async (rasters: DataSource[]): Promise<any> => {
    return (
        await fetch(`${SERVICE_PREFIX}/oge-model-service/api/correction/batchWithDOM/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(rasters.map((elem) => elem.rasterId)),
        })
    ).json();
};

const autoCorrTaskFetcher = async (jobId: string) => {
    return (
        await fetch(`${SERVICE_PREFIX}/oge-model-service/api/correction/batchWithMap/${jobId}`)
    ).json();
}

export type CorrTasksError = undefined | "NotEnoughPoints" | "Waiting";

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
        let jobId = "", executed = false;

        const timer = setInterval(async () => {
            console.log(mode === "manual",
                pendingStatuses.length,
                pendingCountRef.current)
            // if (jobId) return;
            if (mode === "auto") {
                if (pendingCountRef.current === 0) return;
                if (!jobId && !executed) {
                    executed = true;
                    const corrData = (await autoCorrTaskJobFetcher(tasks));
                    jobId = corrData.jobID;
                    const status = corrData.status;
                    if (status === "waiting") {
                        setErrorState("Waiting");
                        clearInterval(timer);
                        return;
                    }
                }
                if (!jobId) return;

                const { result: batchResult, status } = await autoCorrTaskFetcher(jobId);
                if (status !== "running") setPendingCount(0);

                if (status === "failed") {
                    tasks.forEach((elem) => {
                        elem.status = "failed";
                    });
                    jobId = "";
                } else if (status === "successful") {
                    for (const rasterIdKey in batchResult) {
                        const task = tasks[taskIdMap.get(Number(rasterIdKey)) as number];
                        task.result = batchResult[rasterIdKey];
                        task.status = "success";
                    }
                    jobId = "";
                }
            } else if (
                mode === "manual" &&
                pendingStatuses.length > 0 &&
                pendingCountRef.current > 0
            ) {
                const idx = tasks.length - pendingCountRef.current;
                if (pendingStatuses[idx] === false) return;
                const task = tasks[idx];

                if (!jobId && !executed) {
                    executed = true;
                    const corrData = (await manualCorrTaskJobFetcher(task));
                    jobId = corrData.jobID;
                    const status = corrData.status;
                    if (status === "waiting") {
                        setErrorState("Waiting");
                        clearInterval(timer);
                        return;
                    }
                }
                if (!jobId) return;

                let manualCorrTaskRes: ManualCorrTaskResponse | undefined = undefined;

                manualCorrTaskRes = await manualCorrTaskFetcher(jobId);


                if (manualCorrTaskRes) {
                    const { result, status } = manualCorrTaskRes;

                    if (status !== "running") {
                        jobId = "";
                        pendingStatuses[idx] = false;
                        setPendingCount((state) => state - 1);
                        executed = false;
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
