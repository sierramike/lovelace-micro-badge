export default interface IMicroBadgeServiceData {
    [key: string]: any; // Allow additional properties
}

export default interface IMicroBadgeConfig {
    entity_id?: string;
    icon?: string;
    action?: string;
    entity?: string;
    navigation_path?: string;
    url_path?: string;
    url_target?: string;
    service?: string;
    service_data?: IMicroBadgeServiceData;
    styles?: {
        [key: string]: string; // Free object for styles
    };
}
