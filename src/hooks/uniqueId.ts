import { useRef } from "react";

export function useUniqueId() {
    let id = 0;

    const fnRef = useRef(function next() {
        if (id === Number.MAX_SAFE_INTEGER) id = 0;
        return id++;
    });

    return {
        next: fnRef.current,
    };
}
