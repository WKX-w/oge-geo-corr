import { WorkflowPureState } from "@/types";
import { FormattedMessage } from "react-intl";

export function validateState({ rasterIds, selectedIds }: WorkflowPureState, pending: boolean) {
    if (rasterIds.length === 0) {
        return {
            message: (
                <FormattedMessage
                    id="dataSource.footer.hint.noDataSource"
                    defaultMessage="当前没有可用数据源，请从OGE平台数据检索界面导入"
                />
            ),
            canGoNext: false,
        };
    } else if (pending) {
        return {
            message: (
                <FormattedMessage
                    id="dataSource.footer.hint.pending"
                    defaultMessage="正在搜索配准影像并加载WMTS服务，请稍等..."
                />
            ),
            canGoNext: false,
        };
    } else if (selectedIds.length === 0) {
        return {
            message: (
                <FormattedMessage
                    id="dataSource.footer.hint.noneSelected"
                    defaultMessage="请选择存在合适配准影像的待校准影像"
                />
            ),
            canGoNext: false,
        };
    }

    return {
        canGoNext: true,
    };
}
