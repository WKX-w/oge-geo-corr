import { DataSource, RawDataSource } from "@/types";

// 合并多个同类型列表
export function merge<T>(...lists: T[][]) {
    if (lists.length === 0) return [];
    const mergedSet = new Set<T>(lists[0]);

    for (let i = 1; i < lists.length; ++i) {
        for (const num of lists[i]) {
            mergedSet.add(num);
        }
    }

    return Array.from(mergedSet);
}

export function parseRawRasterMeta(rawMeta: RawDataSource): DataSource {
    return {
        ...rawMeta,

        phenomTime: new Date(rawMeta.phenomTime),
        minX: Number(rawMeta.minX),
        minY: Number(rawMeta.minY),
        maxX: Number(rawMeta.maxX),
        maxY: Number(rawMeta.maxY),
    };
}
