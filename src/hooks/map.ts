/* eslint-disable */
import React, { createContext, useContext, useEffect, useState } from "react";

type ReactLeaflet = typeof import("react-leaflet");

type ActualFunctionType<T extends (...args: any) => any> = (
    ...args: Parameters<T>
) => ReturnType<T> | undefined;

type MapHooks = {
    useMap: ActualFunctionType<ReactLeaflet["useMap"]>;
    useMapEvent: ActualFunctionType<ReactLeaflet["useMapEvent"]>;
    useMapEvents: ActualFunctionType<ReactLeaflet["useMapEvents"]>;
};

const useDefault_1 = () => {
    useContext(createContext({}));
    return undefined;
};

const useDefault_2 = () => {
    useContext(createContext({}));
    useEffect(() => {}, [{}, {}]);
    return undefined;
};

let mapHooks: MapHooks = {
    useMap: useDefault_1,
    useMapEvent: useDefault_2,
    useMapEvents: useDefault_2,
};

let isLibLoaded = false;

export function useReactLeafletHooks() {
    const [_, setLoaded] = useState(isLibLoaded);

    useEffect(() => {
        if (isLibLoaded) return;

        import("react-leaflet").then(({ useMap, useMapEvent, useMapEvents }) => {
            mapHooks = { useMap, useMapEvent, useMapEvents };
            setLoaded(true);
            isLibLoaded = true;
        });
    }, []);

    return mapHooks;
}
