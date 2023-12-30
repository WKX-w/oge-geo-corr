import { NextRouter } from "next/router";
import { useRef, useState } from "react";

type AnimationParams = {
    duration?: number;
    easing?: "ease" | "ease-in" | "ease-out" | "ease-in-out";
    delay?: number;
};

type PageTransitionParams = {
    keyframes: Keyframe[];
    fill: FillMode;
    id?: string;
};

function usePageTransition({
    fill,
    keyframes,
    id,
    ...animationParams
}: PageTransitionParams & AnimationParams) {
    const playingRef = useRef(false);
    const animationRef = useRef<Animation>();

    let pointerEvents = "";
    let documentOverflow = "";
    let element: HTMLElement | null = null;

    function storeStyleState(elem: HTMLElement) {
        element = elem;
        pointerEvents = elem.style.pointerEvents;
        documentOverflow = document.body.style.overflow;
        elem.style.pointerEvents = "none";
        document.body.style.overflow = "hidden";
    }

    function recoverStyleState(elem: HTMLElement) {
        elem.style.pointerEvents = pointerEvents;
        document.body.style.overflow = documentOverflow;
    }

    const fns = useRef({
        async play(elem: HTMLElement) {
            if (playingRef.current) return;
            playingRef.current = true;

            storeStyleState(elem);

            if (animationRef.current) animationRef.current.play();
            else {
                animationRef.current = elem.animate(keyframes, {
                    duration: 300,
                    easing: "ease-out",
                    delay: 0,
                    ...animationParams,
                    fill: "forwards",
                });
            }

            return await animationRef.current.finished.then(() => {
                playingRef.current = false;
                recoverStyleState(elem);
            });
        },
        stop() {
            if (!animationRef.current) {
                console.warn(`Transition animation ${id || "__default__id"} instance not exist.`);
                return;
            }
            if (playingRef.current) {
                animationRef.current.finish();
            }
            if (element) recoverStyleState(element);
        },
        isPlaying() {
            return playingRef.current;
        },
    });

    return fns.current;
}

export function usePageSlideOutTransition(params?: AnimationParams) {
    return usePageTransition({
        fill: "forwards",
        keyframes: [
            { offset: 0, opacity: 1, transform: "" },
            { offset: 1, opacity: 0, transform: "translate(-20vw)" },
        ],
        easing: "ease-in",
        ...params,
    });
}

export function usePageSlideInTransition(params?: AnimationParams) {
    return usePageTransition({
        fill: "forwards",
        keyframes: [
            { offset: 0, opacity: 0, transform: "translate(20vw)" },
            { offset: 1, opacity: 1, transform: "" },
        ],
        easing: "ease-out",
        ...params,
    });
}
