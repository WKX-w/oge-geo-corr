import { Workflow } from "@/states/workflow";
import { GetServerSideProps } from "next";
import { getRasterMetadataByImageId } from "./getRasterMetadataByImageId";
import { SSRProps } from "@/types";

export const renderSelectedRasters: GetServerSideProps<SSRProps.SelectedRasters> = async (
    context
) => {
    const rawState = Workflow.parseQuery(context.query);
    const lengthExceeded =
        rawState.selectedIds.length > Number(process.env.NEXT_PUBLIC_MAX_DATA_SOURCE_LENGTH);

    if (lengthExceeded)
        return {
            props: {
                rawSelectedRasterMeta: [],
            },
        };

    const { selectedIds } = Workflow.dispatch(rawState);
    const rawSelectedRasterMeta = await getRasterMetadataByImageId(selectedIds);

    if (rawSelectedRasterMeta.length === 0) {
        return {
            redirect: { destination: `/DataSource?${JSON.stringify(context.query)}` },
            props: {} as any,
        };
    }

    return {
        props: {
            rawSelectedRasterMeta,
        },
    };
};
