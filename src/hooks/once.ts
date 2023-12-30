import { useRef } from "react";

export function useOnce(fn: (...args: any[]) => unknown) {
    const onceRef = useRef(false);
    if (onceRef.current === false) {
        fn();
        onceRef.current = true;
    }
}
