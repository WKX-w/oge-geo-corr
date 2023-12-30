/**
 * TaskOperation
 *
 * @author shepard
 * @date 2023/4/6
 */
import React, { useCallback, useState } from "react";

// ----- Components ----- //
import { Button, Popover, MenuItem } from "@mui/material";
import { FormattedMessage } from "react-intl";

// ----- Interfaces ----- //
import { CorrectionTask, CorrentionTaskBandResult } from "@/types";

// ----- Stylesheet ----- //
import styles from "./TaskOperation.module.scss";

export const TaskOperation = ({
    task,
    onDownloadAllBands,
    onDownloadBand,
}: TaskOperation.Props) => {
    const id = `band__popover__${task.rasterId}`;

    const [showPop, setShowPop] = useState(false);

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | undefined>(undefined);

    const handleTogglePopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        setShowPop((state) => {
            const newState = !state;
            setAnchorEl(newState ? event.currentTarget : undefined);
            return newState;
        });
    }, []);

    const handleClickBandDownloadBtn = useCallback(
        (data: CorrentionTaskBandResult) => {
            if (onDownloadBand) onDownloadBand(data);
        },
        [onDownloadBand]
    );

    const handleClickDownAllBandsBtn = useCallback(() => {
        if (onDownloadAllBands) onDownloadAllBands(task.result);
    }, [onDownloadAllBands]);

    return (
        <div className={`${styles["task-operation"]} Flex-center`}>
            <Button
                className={`${styles["band-btn"]} `}
                variant="outlined"
                aria-describedby={id}
                onClick={handleTogglePopover}
            >
                <FormattedMessage
                    defaultMessage="下载波段..."
                    id="dataSourceTable.columns.taskOperations.download"
                />
            </Button>
            <Popover
                className={`${styles["band-popover"]} `}
                id={id}
                open={showPop}
                onClose={handleTogglePopover}
                anchorEl={anchorEl}
            >
                {task.result.map((data) => (
                    <MenuItem key={data.name} onClick={() => handleClickBandDownloadBtn(data)}>
                        {data.band}
                    </MenuItem>
                ))}
            </Popover>
            {/* <Button
                className={`${styles["down-all-bands-btn"]} `}
                variant="outlined"
                onClick={handleClickDownAllBandsBtn}
            >
                {
                    <FormattedMessage
                        defaultMessage="下载所有波段"
                        id="dataSourceTable.columns.taskOperations.download"
                    />
                }
            </Button> */}
        </div>
    );
};

// eslint-disable-next-line
export namespace TaskOperation {
    export interface Props {
        task: CorrectionTask;
        onDownloadBand?: (data: CorrentionTaskBandResult) => void;
        onDownloadAllBands?: (data: CorrentionTaskBandResult[]) => void;
    }
}
