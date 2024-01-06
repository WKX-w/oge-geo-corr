import { SERVICE_PREFIX } from "@/constants";
import { DataSource, DataSourceStatus, RawDataSource } from "@/types";
import { parseRawRasterMeta } from "@/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

export type TileSourceResponse = {
    result: {
        url: string;
    } | null;
    status: "successful" | "running" | "failed";
};

export const oriImgTileSourceJobFetcher = async (rasterId: number) => {
    return (
        await fetch(
            `${SERVICE_PREFIX}/oge-model-service/api/correction/wmts/image/execute?ImageId=${rasterId}`,
        )
    ).json();
}

export const oriImgTileSourceFetcher = async (jobId: string): Promise<TileSourceResponse> => {
    return (
        await fetch(
            `${SERVICE_PREFIX}/oge-model-service/api/correction/wmts/image/${jobId}`
        )
    ).json();
};

export const getRasterExtent = ({ minX, maxX, minY, maxY }: DataSource) => {
    return { minX, minY, maxY, maxX };
};

export const refImgTileSourceFetcher = async (
    rasterId: number,
    extent: { minX: number; minY: number; maxX: number; maxY: number }
): Promise<TileSourceResponse> => {
    return (
        await fetch(`${SERVICE_PREFIX}/oge-model-service/api/correction/wmts/registrationImage`, {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({
                imageId: rasterId,
                ...extent,
            }),
        })
    ).json();
};

// Handle the logic of polling for tile sources
export function useTileSource(raster: DataSource, pollingInterval?: number, onFailed?: () => void) {
    const sourceLoadedRef = useRef({ left: false, right: false });

    const paramsRef = useRef({ raster, failed: false });

    if (raster !== paramsRef.current.raster) {
        sourceLoadedRef.current = { left: false, right: false };
        paramsRef.current.failed = false;
    }

    Object.assign(paramsRef.current, { raster });

    const rasterId = raster?.rasterId;
    const interval = pollingInterval ?? 2;

    let jobId = "";
    const [leftImgTileSource, setLeftImgTileSource] = useState<TileSourceResponse>({
        status: "running",
        result: {
            url: ""
        }
    });
    useEffect(() => {
        if (!rasterId) return;
        oriImgTileSourceJobFetcher(rasterId).then((data) => {
            jobId = data.jobID;
            console.log(jobId)
            const timer = setInterval(() => {
                oriImgTileSourceFetcher(jobId).then((data) => {
                    setLeftImgTileSource(data);
                    if (data.status !== "running") {
                        clearInterval(timer);
                    }

                });
            }, interval);
        })
    }, [rasterId])

    // const { data: leftImgTileSource } = useSWR("job", () => {
    //     // if (!jobId) return {
    //     //     status: "running",
    //     //     result: {
    //     //         url: null,
    //     //     },
    //     // };
    //     return oriImgTileSourceFetcher(jobId);
    // }, {
    //     refreshInterval: sourceLoadedRef.current.left === false ? interval : undefined,
    // });
    // const { data: rightImgTileSource } = useSWR(
    //     [rasterId, "/registrationImage"],
    //     () => refImgTileSourceFetcher(rasterId, getRasterExtent(raster)),
    //     {
    //         refreshInterval: sourceLoadedRef.current.right === false ? interval : undefined,
    //     }
    // );

    if (leftImgTileSource !== undefined && leftImgTileSource.status !== "running") {
        sourceLoadedRef.current.left = true;
    }

    // if (rightImgTileSource !== undefined && rightImgTileSource.status !== "running") {
    //     sourceLoadedRef.current.right = true;
    // }

    if (
        paramsRef.current.failed === false &&
        (leftImgTileSource?.status === "failed")
    ) {
        if (onFailed) onFailed();
        paramsRef.current.failed = true;
    }

    return {
        tileSources: {
            left: { loading: !sourceLoadedRef.current.left, url: leftImgTileSource?.result?.url.replace("http://125.220.153.22:8093", "http://oge.whu.edu.cn/corr-wmts") },
            right: {
                // loading: !sourceLoadedRef.current.right,
                loading: false,
                // url: rightImgTileSource?.result?.url,
                url: "",
            },
        },
    };
}

// export function useTileSourceValidation(
//     rawSources: RawDataSource[] | undefined,
//     pollingInterval?: number
// ): {
//     rasterMetaStatuses: DataSourceStatus[];
//     pending: boolean;
// } {
//     const interval = pollingInterval ?? 1000;

//     const [pendingCount, setPendingCount] = useState(rawSources?.length ?? 0);

//     const { rasterMetaStatuses, pendingStatuses } = useMemo(() => {
//         if (rawSources === undefined) return { rasterMetaStatuses: [], pendingStatuses: [] };
//         setPendingCount(rawSources.length);

//         const rasterMetaStatuses = rawSources.map((elem) => ({
//             ...parseRawRasterMeta(elem),
//             pending: true,
//             available: false,
//         }));
//         const pendingStatuses: Array<{ left: boolean | undefined; right: boolean | undefined }> =
//             Array(rasterMetaStatuses.length)
//                 .fill(null)
//                 .map(() => ({ left: undefined, right: undefined }));
//         return {
//             pendingStatuses,
//             rasterMetaStatuses,
//         };
//     }, [rawSources]);

//     const pendingCountRef = useRef(pendingCount);
//     pendingCountRef.current = pendingCount;

//     useEffect(() => {
//         const timer = setInterval(async () => {
//             if (rasterMetaStatuses.length === 0 || pendingCountRef.current === 0) return;

//             const idx = rasterMetaStatuses.length - pendingCountRef.current;
//             const raster = rasterMetaStatuses[idx];

//             if (raster.pending === false) return;
//             // console.log("polling:", raster.rasterId, "status", pendingStatuses[idx]);

//             const pendingStatus = pendingStatuses[idx];

//             if (pendingStatus.left === undefined) {
//                 const { status } = await oriImgTileSourceFetcher(raster.rasterId);
//                 // console.log("sending polling request for ori image:", raster.rasterId, status);

//                 if (status === "failed") pendingStatus.left = false;
//                 if (status === "successful") pendingStatus.left = true;
//             }

//             if (pendingStatus.right === undefined) {
//                 const { status } = await refImgTileSourceFetcher(
//                     raster.rasterId,
//                     getRasterExtent(raster)
//                 );
//                 // console.log("sending polling request for ref image:", raster.rasterId, status);
//                 if (status === "failed") pendingStatus.right = false;
//                 if (status === "successful") pendingStatus.right = true;
//             }

//             if (pendingStatus.left !== undefined && pendingStatus.right !== undefined) {
//                 raster.pending = false;
//                 // console.log("rasterId:", raster.rasterId, "setting pending count");
//                 setPendingCount((state) => state - 1);
//                 raster.available = pendingStatus.left === true && pendingStatus.right === true;
//             }
//         }, interval);
//         return () => clearInterval(timer);
//     }, [rasterMetaStatuses, pendingStatuses, interval]);

//     return { rasterMetaStatuses, pending: pendingCount !== 0 };
// }
