/**
 * MapResizeTrigger
 *
 * @author shepard
 * @date 2023/3/25
 */
import { useReactLeafletHooks } from "@/hooks/map";
import React, { useEffect } from "react";

// ----- Components ----- //

// ----- Interfaces ----- //

// ----- Stylesheet ----- //
export const MapResizeTrigger = ({ trigger }: MapResizeTrigger.Props) => {
    const { useMap } = useReactLeafletHooks();

    const map = useMap();

    useEffect(() => {
        if (map !== undefined) {
            map.invalidateSize();
        }
    }, [map, trigger]);

    return <></>;
};
// eslint-disable-next-line
export namespace MapResizeTrigger {
    export interface Props {
        trigger?: any;
    }
}
