/**
 * RemoveMarker
 *
 * @author shepard
 * @date 2023/3/23
 */
import React, { useEffect } from "react";
// ----- Components ----- //

// ----- Interfaces ----- //

// ----- Stylesheet ----- //
import { useReactLeafletHooks } from "@/hooks/map";

export const MapAttribute = ({ attribName }: MapAttribute.Props): JSX.Element => {
    const { useMap } = useReactLeafletHooks();

    const map = useMap();

    useEffect(() => {
        if (map) {
            map.attributionControl.setPrefix(attribName ?? "Leaflet");
            map.attributionControl.setPosition("topright");
        }
    }, [map, attribName]);

    return <></>;
};

MapAttribute.displayName = "RemoveMarker";

// eslint-disable-next-line
export namespace MapAttribute {
    export interface Props {
        attribName?: string;
    }
}
