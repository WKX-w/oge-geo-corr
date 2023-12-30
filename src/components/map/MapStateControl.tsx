/**
 * MapStateListener
 *
 * @author shepard
 * @date 2023/3/24
 */
import React, { useEffect, useRef } from "react";

// ----- Components ----- //

// ----- Interfaces ----- //
import type { LatLngBoundsLiteral, LatLngLiteral } from "leaflet";

// ----- Stylesheet ----- //
import { useReactLeafletHooks } from "@/hooks/map";

export const MapStateControl = ({
    onViewportChange,
    center,
    onMapClick,
    zoom,
}: MapStateControl.Props): JSX.Element => {
    const { useMapEvents } = useReactLeafletHooks();

    const triggerRef = useRef<"user" | "component">("user");

    const map = useMapEvents({
        zoomend: handleViewportChange,
        moveend: handleViewportChange,
        click: (ev) => {
            if (!onMapClick) return;
            onMapClick({ lat: ev.latlng.lat, lng: ev.latlng.lng });
        },
    });

    function handleViewportChange() {
        if (triggerRef.current === "user" && map && onViewportChange) {
            const { lat, lng } = map.getCenter();
            onViewportChange({
                center: { lat, lng },
                zoom: map.getZoom(),
            });
        }
        triggerRef.current = "user";
    }

    useEffect(() => {
        if (
            !map ||
            center === undefined ||
            zoom === undefined ||
            (map.getCenter().equals(center) && map.getZoom() === zoom)
        )
            return;
        triggerRef.current = "component";
        map.setView(center, zoom, { animate: false });
    }, [center, zoom, map]);

    return <></>;
};

// eslint-disable-next-line
export namespace MapStateControl {
    export type Viewport = {
        center: LatLngLiteral;
        zoom: number;
    };

    export interface Props {
        onViewportChange?: (viewport: Viewport) => void;
        onMapClick?: (pos: LatLngLiteral) => void;
        zoom: number;
        center: LatLngLiteral;
    }
}
