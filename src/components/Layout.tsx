/**
 * Layout
 *
 * @author shepard
 * @date 2023/3/18
 */
import { useRouter } from "next/router";
import React, { useContext, useMemo, useEffect, useCallback, useState } from "react";
import { StepDependencyChecker, workflowSteps } from "./Layout.data";
import { workflowCtx } from "@/states/workflow";

// ----- Components ----- //
import IconLanguage from "@mui/icons-material/Translate";
import { FormattedMessage, useIntl } from "react-intl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Snackbar from "@mui/material/Snackbar/";
import Alert from "@mui/material/Alert/";
import MenuItem from "@mui/material/MenuItem";
import Link from "next/link";

// ----- Interfaces ----- //
import { StepName, SupportedLocale } from "@/types";
import { AlertColor } from "@mui/material/Alert/";

// ----- Stylesheet ----- //
import styles from "./Layout.module.scss";

export const Layout = React.forwardRef<HTMLDivElement, Layout.Props>(
    ({ className = "", children, currentStep: currentStepName, ...otherProps }, ref) => {
        const router = useRouter();

        const handleChangeLocale = useCallback(
            (ev: SelectChangeEvent) => {
                const value = ev.target.value as SupportedLocale;
                router.push(router.asPath, undefined, { locale: value });
            },
            [router]
        );

        const { workflowState } = useContext(workflowCtx);

        const steps = workflowSteps[workflowState.mode];
        const currentStep = steps[currentStepName];

        const [alertState, setAlertState] = useState<{
            show: boolean;
            severity: AlertColor;
            message: React.ReactNode;
            redirectTo: string;
        }>({
            show: false,
            severity: "info",
            message: "",
            redirectTo: "",
        });

        useEffect(() => {
            const idleCb = requestIdleCallback(() => {
                console.log("currentStep:", currentStep, "mode:", workflowState);

                const result: ReturnType<StepDependencyChecker> =
                    currentStep !== undefined
                        ? currentStep.checker(workflowState)
                        : {
                              message: (
                                  <FormattedMessage
                                      defaultMessage="无法执行当前几何纠正步骤，正在返回首页"
                                      id="layout.checkers.fallback"
                                  />
                              ),
                              severity: "error",
                              shouldRedirect: true,
                              to: "/",
                          };

                if (result.shouldRedirect === true) {
                    setAlertState({
                        severity: result.severity,
                        show: true,
                        message: result.message,
                        redirectTo: result.to,
                    });
                }
            });
            return () => {
                cancelIdleCallback(idleCb);
            };
        }, [steps, workflowState, currentStep]);

        const handleHideAlert = useCallback(() => {
            setAlertState((state) => {
                router.push(state.redirectTo);
                return {
                    show: false,
                    severity: "info",
                    message: "",
                    redirectTo: "",
                };
            });
        }, [router]);

        return (
            <main
                className={`${styles["layout"]} ${className} Flex-col-start-start`}
                ref={ref}
                {...otherProps}
            >
                <Snackbar
                    open={alertState.show}
                    autoHideDuration={1500}
                    onClose={handleHideAlert}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                >
                    <Alert severity={alertState.severity}>{alertState.message}</Alert>
                </Snackbar>
                <h1 className={`${styles["heading"]} `}>
                    <FormattedMessage defaultMessage="开放地球引擎几何校正" id="layout.heading" />
                </h1>
                <Breadcrumbs className={`${styles["breadcrumbs"]} `}>
                    {Object.entries(steps)
                        .slice(0, (currentStep?.seq ?? 0) + 1)
                        .map(([_, value], idx) => {
                            return currentStep?.seq !== idx ? (
                                <Link
                                    key={value.href}
                                    className={`${styles["breadcrumbs-link"]} `}
                                    href={{
                                        pathname: value.href,
                                        query: router.query,
                                    }}
                                >
                                    {value.step}
                                </Link>
                            ) : (
                                <div
                                    key={value.href}
                                    className={`${styles["breadcrumbs-current"]} `}
                                >
                                    {value.step}
                                </div>
                            );
                        })}
                </Breadcrumbs>
                <div className={`${styles["select-lang"]} Flex`}>
                    <IconLanguage />
                    <Select
                        className={`${styles["select"]} Flex-grow`}
                        labelId="locale"
                        onChange={handleChangeLocale}
                        value={router.locale ?? process.env.NEXT_PUBLIC_DEF_LOCALE}
                    >
                        <MenuItem value="zh-CN">简体中文</MenuItem>
                        <MenuItem value="en-US">English(US)</MenuItem>
                    </Select>
                </div>
                {children}
            </main>
        );
    }
);

Layout.displayName = "Layout";

// eslint-disable-next-line
export namespace Layout {
    export interface Props extends React.ComponentPropsWithRef<"main"> {
        currentStep: StepName;
    }
}
