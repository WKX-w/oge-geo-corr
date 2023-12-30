/**
 * PickerToolbox
 *
 * @author shepard
 * @date 2023/3/25
 */
import { Button, Tooltip } from "@mui/material";
import React, { useCallback } from "react";

// ----- Components ----- //
import IconFullscreen from "@mui/icons-material/Fullscreen";
import IconLink from "@mui/icons-material/InsertLink";
import { FormattedMessage } from "react-intl";
import IconAddCircleOutline from "@mui/icons-material/AddCircleOutline";
import LocateIcon from "/public/locate.svg";

// ----- Interfaces ----- //

// ----- Stylesheet ----- //
import styles from "./PickerToolbox.module.scss";

const toolboxButtons: {
    component: React.ReactNode;
    stateName: keyof PickerToolbox.ToolButtonStates;
    tooltip: React.ReactNode;
}[] = [
    {
        component: <LocateIcon />,
        stateName: "locateView",
        tooltip: (
            <FormattedMessage
                id="pickerToolbox.locateView"
                defaultMessage="定位视图到当前待配准影像中心位置"
            />
        ),
    },
    {
        component: <IconAddCircleOutline />,
        stateName: "addPoint",
        tooltip: (
            <FormattedMessage
                id="pickerToolbox.addPoint"
                defaultMessage="新增一个同名点并设为当前编辑的同名点"
            />
        ),
    },
    {
        component: <IconFullscreen />,
        stateName: "fullscreen",
        tooltip: <FormattedMessage id="pickerToolbox.fullscreen" defaultMessage="扩展影像视图" />,
    },
    {
        component: <IconLink />,
        stateName: "linked",
        tooltip: (
            <FormattedMessage id="pickerToolbox.link" defaultMessage="链接两幅视图当前的坐标位置" />
        ),
    },
];

export const PickerToolbox = React.forwardRef<HTMLDivElement, PickerToolbox.Props>(
    ({ className = "", onStateChange, getCurrentPointId, states, ...otherProps }, ref) => {
        const handleToolButtonClicked = useCallback(
            (which: keyof PickerToolbox.ToolButtonStates) => {
                const newState = Object.assign({}, states);
                let notify = false;

                switch (which) {
                    case "fullscreen":
                        newState.fullscreen = !newState.fullscreen;
                        notify = true;
                        break;
                    case "linked":
                        newState.linked = !newState.linked;
                        notify = true;
                        break;
                    case "addPoint":
                        notify = true;
                        break;
                    case "locateView":
                        notify = true;
                        break;
                }

                if (notify && onStateChange) onStateChange(which, newState);
            },
            [onStateChange, states]
        );

        function isEnabled<T extends keyof PickerToolbox.ToolButtonStates>(
            stateName: T,
            stateValue: PickerToolbox.ToolButtonStates[T]
        ): Boolean {
            switch (stateName) {
                case "fullscreen":
                case "linked":
                    return stateValue as Boolean;
                case "addPoint":
                case "locateView":
                    return false;
            }
            return true;
        }

        return (
            <div
                className={`${styles["picker-toolbox"]} Flex-end ${className} `}
                ref={ref}
                {...otherProps}
            >
                <span className={`${styles["current-point"]} Flex-grow`}>
                    <FormattedMessage
                        id="pickerToolbox.currentPoint"
                        defaultMessage="当前同名点 {currentPoint}"
                        values={{
                            currentPoint:
                                getCurrentPointId !== undefined ? getCurrentPointId() : "",
                        }}
                    />
                </span>
                {toolboxButtons.map(({ component, stateName, tooltip }) => (
                    <Tooltip title={tooltip} key={stateName}>
                        <Button
                            className={`${styles["tool-button"]} `}
                            data-enabled={isEnabled(stateName, states[stateName])}
                            onClick={() => handleToolButtonClicked(stateName)}
                        >
                            {component}
                        </Button>
                    </Tooltip>
                ))}
            </div>
        );
    }
);

PickerToolbox.displayName = "PickerToolbox";

// eslint-disable-next-line
export namespace PickerToolbox {
    export type ToolButtonStates = {
        linked: boolean;
        fullscreen: boolean;
        addPoint: void;
        locateView: void;
    };
    export interface Props extends React.ComponentPropsWithRef<"div"> {
        onStateChange?: (cause: keyof ToolButtonStates, current: ToolButtonStates) => void;
        states: ToolButtonStates;
        getCurrentPointId?: () => string;
    }
}
