import Head from "next/head";
import { FormattedMessage, useIntl } from "react-intl";
import {} from "@mui/material";
import { Layout } from "@/components";
import styles from "./index.module.scss";
import Image from "next/image";
import IconArrowCircleRight from "@mui/icons-material/ArrowCircleRight";

import imgAutoCorr from "/public/images/auto-correction.jpg";
import imgManCorr from "/public/images/manual-correction.jpg";
import { MouseEvent as ReactMouseEvent, useCallback, useContext, useEffect, useRef } from "react";
import { usePageSlideInTransition, usePageSlideOutTransition } from "@/hooks/transition";
import { useRouter } from "next/router";
import { CorrMode } from "@/types";
import { Workflow, workflowCtx } from "@/states/workflow";

const modes: {
    mode: CorrMode;
    imgSrc: import("next/image").StaticImageData;
    messsage: React.ReactNode;
}[] = [
    {
        mode: "auto",
        imgSrc: imgAutoCorr,
        messsage: <FormattedMessage defaultMessage="自动几何校正" id="home.mode.auto" />,
    },
    {
        mode: "manual",
        imgSrc: imgManCorr,
        messsage: <FormattedMessage defaultMessage="手动几何校正" id="home.mode.manual" />,
    },
];

export default function HomePage() {
    const intl = useIntl();

    const mainRef = useRef<HTMLDivElement>(null);

    const { push } = useRouter();

    const { play: playSlideOut } = usePageSlideOutTransition();

    const { updateWorkflowState } = useContext(workflowCtx);

    const handleSelectMode = useCallback(
        async (event: ReactMouseEvent<HTMLDivElement, MouseEvent>, mode: CorrMode) => {
            if (mainRef.current) await playSlideOut(mainRef.current);
            const newState = await updateWorkflowState({ mode }, "User selects correction mode.");
            push({ pathname: "/DataSource", query: Workflow.stringify(newState) });
        },
        [push, updateWorkflowState, playSlideOut]
    );

    const { play: playSlideIn } = usePageSlideInTransition();

    useEffect(() => {
        if (mainRef.current) playSlideIn(mainRef.current);
    }, [playSlideIn]);

    return (
        <Layout currentStep="SelectMode" className={`${styles["index"]} `}>
            <Head>
                <title>
                    {intl.formatMessage({
                        defaultMessage: "欢迎使用开放地球引擎几何校正",
                        id: "home.title",
                    })}
                </title>
                <meta
                    name="description"
                    content={intl.formatMessage({
                        defaultMessage:
                            "开放地球引擎几何校正功能，结合先进的影像配准算法通过手动或自动方式实现影像几何校正",
                        id: "home.descrip",
                    })}
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <div className="Flex-space" />
            <div className={`${styles["selector"]} Flex-between Transparent`} ref={mainRef}>
                {modes.map((elem) => (
                    <div
                        className={`${styles["mode"]} Flex-colrev`}
                        onClick={(event) => handleSelectMode(event, elem.mode)}
                        key={elem.mode}
                    >
                        <h3 className={`Flex`}>
                            <span>{elem.messsage}</span>
                            <IconArrowCircleRight />
                        </h3>

                        <div className={`${styles["img-mask"]} `}>
                            <Image alt="" src={elem.imgSrc} />
                        </div>
                    </div>
                ))}
            </div>
        </Layout>
    );
}
