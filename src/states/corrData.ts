import { NO_DATA } from "@/constants";
import { CorrPoint, RasterCorrData } from "@/types";

let __localStorage: Window["localStorage"] | undefined = undefined;

function initLocalStorage(storage: Window["localStorage"]) {
    __localStorage = storage;
}

function throwStorageError() {
    throw new Error("LocalStorage has not been initialized.");
}

function genDataKey(rasterId: number) {
    return `__raster_${rasterId}`;
}

function retrieveRasterCorrDataById(rasterId: number): RasterCorrData {
    if (__localStorage === undefined) {
        throwStorageError();
        return [];
    }

    const dataStr = __localStorage.getItem(genDataKey(rasterId));
    if (dataStr === null) return [];
    return JSON.parse(dataStr);
}

function storeRasterCorrData(rasterId: number, data: RasterCorrData): void {
    if (__localStorage === undefined) {
        throwStorageError();
        return;
    }

    if (__localStorage === undefined) return;
    __localStorage.setItem(genDataKey(rasterId), JSON.stringify(data));
}

function hasRasterCorrData(rasterId: number): boolean {
    if (__localStorage === undefined) {
        throwStorageError();
        return false;
    }

    if (__localStorage === undefined) return false;
    return __localStorage.getItem(genDataKey(rasterId)) !== null;
}

export class CorrDataState {
    constructor(state?: CorrDataState, replaceData?: { rasterId: number; data: RasterCorrData }) {
        if (state !== undefined) this._loadedData = state._loadedData;
        if (__localStorage !== undefined && replaceData !== undefined) {
            const { rasterId, data } = replaceData;
            this._loadedData.set(rasterId, data);
            storeRasterCorrData(rasterId, data);
        }

        const self = this;
        return new Proxy(self, {
            get(_, p) {
                if (p === "_loadedData") return self._loadedData;

                const numP = Number(typeof p === "symbol" ? Symbol.keyFor(p) : p);
                if (Number.isNaN(numP)) throw new Error("Property must be indexed by number.");
                let data: RasterCorrData = self._loadedData.get(numP) ?? [];
                if (data.length > 0) return data;

                if (__localStorage !== undefined) {
                    data = retrieveRasterCorrDataById(numP);
                    if (data.length > 0) self._loadedData.set(numP, data);
                }
                return data;
            },
        });
    }

    static initStorage(storage: Window["localStorage"]) {
        __localStorage = storage;
    }

    [idx: number]: RasterCorrData;
    private _loadedData = new Map<number, RasterCorrData>();
}

export const createCorrPoint = ({
    id,
    leftLat,
    leftLng,
    rightLat,
    rightLng,
}: {
    id: number;
    leftLat?: number;
    leftLng?: number;
    rightLat?: number;
    rightLng?: number;
}): CorrPoint => ({
    id,
    leftLat: leftLat ?? NO_DATA,
    leftLng: leftLng ?? NO_DATA,
    rightLat: rightLat ?? NO_DATA,
    rightLng: rightLng ?? NO_DATA,
});
