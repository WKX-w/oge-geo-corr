import React from "react";

export type ChildWithSlot<T> = React.ReactElement<{ slot?: T }>;

/**
 * Slots获取指定槽的子组件
 *
 * @author shepard
 * @date 2022/08/07
 */
export function getChildSlotMap<T extends string>(
    children: ChildWithSlot<T> | ChildWithSlot<T>[] | undefined,
    slots: T | T[]
): [{ [key in T]?: ChildWithSlot<T>[] }, ChildWithSlot<undefined>[]] {
    if (children === undefined) return [{}, []];

    const normalizedChildren = Array.isArray(children) ? children : [children];
    const normalizedSlots = Array.isArray(slots) ? slots : [slots];

    const slotsMap = Object.fromEntries(
        normalizedSlots.map((s) => [s, [] as ChildWithSlot<T>[]])
    ) as { [key in T]: ChildWithSlot<T>[] };
    const defaultSlotChildren: ChildWithSlot<undefined>[] = [];

    for (const child of normalizedChildren) {
        if (child?.props.slot === undefined) {
            defaultSlotChildren.push(child as ChildWithSlot<undefined>);
        } else {
            const gatheredChildren = slotsMap[child.props.slot];
            if (gatheredChildren)
                gatheredChildren.push(child as ChildWithSlot<T>);
        }
    }

    return [slotsMap, defaultSlotChildren];
}
