export interface OpManagerAlert {
    severity?: number | string;
    severityString?: string;
    deviceName?: string;
    displayName?: string;
    ipaddress?: string;
    ipAddress?: string;
    category?: string;
    message?: string;
    status?: string;
    modifiedTime?: string;
    prettyTime?: string;
    [key: string]: any;
}
