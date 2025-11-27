export interface OpManagerInterface {
    displayName?: string;
    ifName?: string;
    ifAlias?: string;
    ifDesc?: string;
    ifSpeed?: string;
    status?: string;
    statusStr?: string;
    inSpeed?: string;
    outSpeed?: string;
    type?: string;
    interfaceName?: string;
    [key: string]: any;
}

export interface InterfaceSummary {
    NFA_ID?: string;
    IntfIpaddress?: string;
    displayName?: string;
    Util?: number | string;
    availability?: Record<string, number>;
    inTraffic?: string;
    outTraffic?: string;
    operState?: string;
    adminState?: string;
    Errors?: string;
    Discards?: string;
    rxUtil?: string;
    txUtil?: string;
    [key: string]: any;
}

export interface InterfaceGraphData {
    interfaceDetails?: Record<string, any>;
    displayName?: string;
    consolidatedValues?: Record<string, any>;
    graphData?: Array<{ seriesname: string; data: Array<any> }>;
    xyTitles?: string[];
    [key: string]: any;
}
