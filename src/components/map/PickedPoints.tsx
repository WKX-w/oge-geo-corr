/**
 * PickedPoints
 *
 * @author shepard
 * @date 2023/3/24
 */
import React, { useEffect, useMemo, useState } from "react";

// ----- Components ----- //
import dynamic from "next/dynamic";
const Circle = dynamic(() => import("react-leaflet").then((module) => module.Circle), {
    ssr: false,
});
const Polyline = dynamic(() => import("react-leaflet").then((module) => module.Polyline), {
    ssr: false,
});
const SVGOverlay = dynamic(() => import("react-leaflet").then((module) => module.SVGOverlay), {
    ssr: false,
});
import { useReactLeafletHooks } from "@/hooks/map";
import { useUniqueId } from "@/hooks/uniqueId";

// ----- Interfaces ----- //
import { LatLngBoundsLiteral } from "leaflet";

// ----- Styles ----- //
import styles from "./PickedPoints.module.scss";

export const PickedPoints = ({ points }: PickedPoints.Props) => {
    const { useMapEvents } = useReactLeafletHooks();

    const [zoomLevel, setZoomLevel] = useState(18);

    const { next } = useUniqueId();

    const map = useMapEvents({
        zoomend: () => {
            if (!map) return;
            setZoomLevel(map.getZoom());
        },
    });

    useEffect(() => {
        if (!map) return;
        setZoomLevel(map.getZoom());
    }, [map]);

    const markers = useMemo(() => {
        return (points ?? []).map(({ id, lat, lng }) => {
            const mapScale = Math.pow(2, 18 - zoomLevel);
            const baseScale = 0.5;
            const lineSpan = 0.00025 * mapScale * baseScale;

            const verLine = (
                <Polyline
                    className={`${styles["polyline-ver"]} `}
                    key={`${id}_polyline_ver`}
                    positions={[
                        [lat - lineSpan / 2.0, lng],
                        [lat + lineSpan / 2.0, lng],
                    ]}
                ></Polyline>
            );
            const horLine = (
                <Polyline
                    className={`${styles["polyline-hor"]} `}
                    key={`${id}_polyline_hor`}
                    positions={[
                        [lat, lng - lineSpan / 2.0],
                        [lat, lng + lineSpan / 2.0],
                    ]}
                ></Polyline>
            );

            const slashLine = (
                <Polyline
                    className={`${styles["polyline-slash"]} `}
                    key={`${id}_polyline_slash`}
                    positions={[
                        [lat - lineSpan / 2.0, lng - lineSpan / 2.0],
                        [lat + lineSpan / 2.0, lng + lineSpan / 2.0],
                    ]}
                ></Polyline>
            );
            const backslashLine = (
                <Polyline
                    className={`${styles["polyline-backslash"]} `}
                    key={`${id}_polyline_backslash`}
                    positions={[
                        [lat - lineSpan / 2.0, lng + lineSpan / 2.0],
                        [lat + lineSpan / 2.0, lng - lineSpan / 2.0],
                    ]}
                ></Polyline>
            );

            const annoBounds: LatLngBoundsLiteral = [
                [lat + lineSpan / 2.0, lng + lineSpan / 2.0],
                [lat + lineSpan * 2.0, lng + lineSpan * 2.0],
            ];
            const annotation = (
                <SVGOverlay
                    className={`${styles["anno-svg-overlay"]} `}
                    key={`${id}_svg_${next()}`} // This triggeres complete rerender.
                    bounds={annoBounds}
                >
                    <text x="0" y="95%" className={`${styles["anno-text"]} `}>
                        {id}
                    </text>
                </SVGOverlay>
            );
            return {
                verLine,
                horLine,
                slashLine,
                backslashLine,
                annotation,
            };
        });
    }, [points, zoomLevel, next]);

    return (
        <>
            {markers.map(({ annotation, backslashLine, horLine, verLine, slashLine }) => [
                annotation,
                backslashLine,
                verLine,
                horLine,
                slashLine,
            ])}
        </>
    );
};

// eslint-disable-next-line
export namespace PickedPoints {
    export type Point = { lat: number; lng: number; id: number };
    export interface Props {
        points?: Point[];
    }
}
