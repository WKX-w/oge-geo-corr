import React, { useState, useRef, useEffect } from "react";

export function useMixedState<T>(propState: T, onChange?: (state: T) => void, debug?: boolean) {
    if (debug) console.log("receiving propstate:", propState);

    const [myState, setMyState] = useState(propState);

    const changeFnRef = useRef(onChange);
    changeFnRef.current = onChange;

    useEffect(() => {
        if (debug) console.log("emitting changes");
        if (changeFnRef.current) changeFnRef.current(myState);
    }, [myState]);

    useEffect(() => {
        if (debug) console.log("parent changes", propState);
        setMyState(propState);
    }, [propState]);

    return [myState, setMyState] as const;
}
