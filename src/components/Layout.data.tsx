import { FormattedMessage, IntlShape } from "react-intl";
import { CorrMode, StepName, WorkflowPureState } from "@/types/";
import { AlertColor } from "@mui/material/Alert/";

export type StepDependencyChecker = (state: WorkflowPureState) =>
    | {
          shouldRedirect: false;
      }
    | {
          shouldRedirect: true;
          to: string;
          message: React.ReactNode;
          severity: AlertColor;
      };

const checkSelection: StepDependencyChecker = ({ selectedIds }) => {
    if (selectedIds.length === 0) {
        return {
            message: (
                <FormattedMessage
                    id="layout.checkers.noSelectedIds"
                    defaultMessage="未选择任何影像"
                />
            ),
            severity: "error",
            shouldRedirect: true,
            to: "/DataSource",
        };
    }
    return { shouldRedirect: false };
};

const noneChecker: StepDependencyChecker = () => ({ shouldRedirect: false });

export const workflowSteps: {
    [key in CorrMode | "default"]: Partial<
        Record<
            StepName,
            {
                href: string;
                step: React.ReactNode;
                checker: StepDependencyChecker;
                seq: number;
            }
        >
    >;
} = {
    auto: {
        SelectMode: {
            href: "/",
            step: (
                <FormattedMessage defaultMessage="选择校正模式" id="layout.mode.auto.selectMode" />
            ),
            checker: noneChecker,
            seq: 0,
        },
        LinkDataSource: {
            href: "/DataSource",
            step: <FormattedMessage defaultMessage="链接数据源" id="layout.mode.auto.linkSource" />,
            seq: 1,
            checker: noneChecker,
        },
        MonitorTasks: {
            href: "/Tasks",
            step: (
                <FormattedMessage defaultMessage="任务查看器" id="layout.mode.auto.taskMonitor" />
            ),
            seq: 2,
            checker: noneChecker,
        },
    },
    manual: {
        SelectMode: {
            href: "/",
            step: (
                <FormattedMessage
                    defaultMessage="选择校正模式"
                    id="layout.mode.manual.selectMode"
                />
            ),
            seq: 0,
            checker: noneChecker,
        },
        LinkDataSource: {
            href: "/DataSource",
            step: (
                <FormattedMessage defaultMessage="链接数据源" id="layout.mode.manual.linkSource" />
            ),

            seq: 1,
            checker: noneChecker,
        },
        MatchHomoPoints: {
            href: "/Picker",
            step: (
                <FormattedMessage
                    defaultMessage="匹配同名点"
                    id="layout.mode.manual.pickHomoPoints"
                />
            ),

            seq: 2,
            checker: checkSelection,
        },

        MonitorTasks: {
            href: "/Tasks",
            step: (
                <FormattedMessage defaultMessage="任务查看器" id="layout.mode.manual.taskMonitor" />
            ),
            seq: 3,
            checker: noneChecker,
        },
    },
    default: {
        SelectMode: {
            href: "/",
            step: (
                <FormattedMessage
                    defaultMessage="选择校正模式"
                    id="layout.mode.default.selectMode"
                />
            ),
            seq: 0,
            checker: noneChecker,
        },
    },
};
