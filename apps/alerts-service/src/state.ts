/** When a sustained threshold violation began. Key: "node:sensor" */
export const violationStartMap = new Map<string, number>();

/** Last time an alert was dispatched, for deduplication. Key: "node:sensor" */
export const lastAlertMap = new Map<string, number>();

/** Last MQTT message time per node, for heartbeat monitoring. Key: NodeId */
export const lastSeenMap = new Map<string, number>();

/** Whether we already fired an offline alert for a node. Key: NodeId */
export const nodeOfflineAlerted = new Map<string, boolean>();
