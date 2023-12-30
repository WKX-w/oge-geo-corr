import { useState, useEffect, useRef } from "react";

export function useLocalStorage(cb?: (storage: Window["localStorage"]) => void) {
    const [storage, setStorage] = useState<Window["localStorage"] | undefined>(undefined);

    const cbRef = useRef(cb);

    useEffect(() => {
        setStorage((state) => {
            if (state !== undefined) return;

            console.log(`LocalStorage loaded. Triggering rerender.`);
            if (cbRef.current) cbRef.current(window.localStorage);

            return window.localStorage;
        });
    }, []);

    return storage;
}
