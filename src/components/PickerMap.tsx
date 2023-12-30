/**
 * PickerMap
 *
 * @author shepard
 * @date 2023/3/23
 */
import dynamic from "next/dynamic";
import React, { useCallback } from "react";
import LoadingIcon from "/public/loading.svg";

// ----- Components ----- //
const MapContainer = dynamic(() => import("react-leaflet").then((module) => module.MapContainer), {
    ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((module) => module.TileLayer), {
    ssr: false,
});
import { MapStateControl } from "./map/MapStateControl";
import { PickedPoints } from "./map/PickedPoints";
import { MapResizeTrigger } from "./map/MapResizeTrigger";
import { MapAttribute } from "./map/MapAttribute";
import { FormattedMessage } from "react-intl";
import Image from "next/image";

// ----- Interfaces ----- //
import type { MapContainerProps } from "react-leaflet";
import type { LatLngLiteral } from "leaflet";
import { Certain } from "@/types/utils";

// ----- Stylesheet ----- //
import styles from "./PickerMap.module.scss";

export const PickerMap = ({
    className = "",
    onViewportChange,
    zoom,
    tileSource,
    points,
    onAppendPoint,
    attribName,
    center,
    showLoading = false,
    resizeTrigger,
    baseMap = false,
    ...otherProps
}: PickerMap.Props) => {
    const handleMapClick = useCallback<Certain<MapStateControl.Props["onMapClick"]>>(
        (pos) => {
            if (onAppendPoint) onAppendPoint(pos);
        },
        [onAppendPoint]
    );

    return showLoading ? (
        <div className={`${styles["picker-map-loading"]} Flex-col-center-center`}>
            <span>
                <FormattedMessage id="pickerMap.loading" defaultMessage="正在加载 ..." />
            </span>
            <LoadingIcon />
        </div>
    ) : (
        <MapContainer
            className={`${styles["picker-map"]} ${className} `}
            zoom={zoom}
            center={center}
            {...otherProps}
        >
            {baseMap ? (
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            ) : null}
            {tileSource ? <TileLayer url={tileSource} /> : null}
            <PickedPoints points={points} />
            <MapAttribute attribName={attribName} />
            <MapResizeTrigger trigger={resizeTrigger} />
            <MapStateControl
                zoom={zoom}
                center={center}
                onViewportChange={onViewportChange}
                onMapClick={handleMapClick}
            />
        </MapContainer>
    );
};

PickerMap.displayName = "PickerMap";

// eslint-disable-next-line
export namespace PickerMap {
    export type Viewport = MapStateControl.Viewport;
    export type Point = PickedPoints.Point;
    export interface Props extends Omit<MapContainerProps, "ref"> {
        onViewportChange?: MapStateControl.Props["onViewportChange"];
        zoom: number;
        center: LatLngLiteral;
        attribName?: string;
        points?: Point[];
        onAppendPoint?: (pos: LatLngLiteral) => void;
        tileSource?: string;
        // Change the value of this props to trigger a map resize
        resizeTrigger?: {};
        showLoading?: boolean;
        baseMap?: boolean;
    }
}
