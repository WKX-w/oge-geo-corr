import { MIN_CORR_POINTS } from "@/constants";
import { CorrDataState } from "@/states/corrData";
import { DataSource, RasterCorrData } from "@/types";
import { LatLngLiteral } from "leaflet";
import { FormattedMessage } from "react-intl";

export const deriveFromCorrData = (data: RasterCorrData) => ({
    leftPoints: data.map(({ id, leftLat, leftLng }) => ({
        id,
        lat: leftLat,
        lng: leftLng,
    })),
    rightPoints: data.map(({ id, rightLat, rightLng }) => ({
        id,
        lat: rightLat,
        lng: rightLng,
    })),
});

export const computeRasterCenter = (raster: DataSource): LatLngLiteral => ({
    lat: (raster.minY + raster.maxY) / 2,
    lng: (raster.minX + raster.maxX) / 2,
});

export const validate = (
    rasters: Map<number, DataSource>,
    corrDataState: CorrDataState
): { message: React.ReactNode; canGoNext: boolean } => {
    for (const id of rasters.keys()) {
        if (corrDataState[id].length <= MIN_CORR_POINTS) {
            return {
                message: (
                    <FormattedMessage
                        id="picker.validate.notEnoughPoints"
                        defaultMessage="同名点数量不足，每张影像需要至少 {minPoints} 个同名点"
                        values={{ minPoints: MIN_CORR_POINTS }}
                    />
                ),
                canGoNext: false,
            };
        }
    }
    return {
        message: "",
        canGoNext: true,
    };
};
