export type SupportedLocale = "zh-CN" | "en-US";

export type StepName = "SelectMode" | "LinkDataSource" | "MatchHomoPoints" | "MonitorTasks";

export type RawDataSource = {
    thumbnailUrl: string | null;
    rasterId: number;
    rasterName: string;
    productName: string;
    productCategory: string;
    sensorType: string | null;
    platformName: string | null;
    cloudage: number | null;
    phenomTime: string;
    crs: string;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};

export namespace SSRProps {
    export type SelectedRasters = {
        rawSelectedRasterMeta: RawDataSource[];
    };
}

export interface DataSource extends RawDataSource {
    phenomTime: Date;
}

export interface DataSourceStatus extends DataSource {
    pending: boolean;
    available: boolean;
}

export interface CorrectionTask extends DataSource {
    status: "running" | "success" | "failed";
    result: Array<{
        name: string;
        band: string;
        url: string;
    }>;
}

export type CorrentionTaskBandResult = CorrectionTask["result"] extends (infer ElementType)[]
    ? ElementType
    : never;

export type CorrMode = "manual" | "auto" | "default";

export type CorrQuery = {
    mode: string;
    "raster-ids": string;
    "selected-ids": string;
    "oge-retrieved-ids": string;
};

export interface WorkflowPureState {
    [index: string]: any;
    mode: CorrMode;
    rasterIds: number[];
    selectedIds: number[];
}

export interface WorkflowState extends WorkflowPureState {
    ogeRetrievedIds: number[];
}

/**
 * Set the workflow state context. The function returns the serialized query string
 */
export type WorkflowStateSetter = (
    action: Partial<WorkflowPureState>,
    reason?: string
) => Promise<WorkflowPureState>;

export type CorrPoint = {
    id: number;
    leftLng: number;
    leftLat: number;
    rightLng: number;
    rightLat: number;
};

export type RasterCorrData = CorrPoint[];
