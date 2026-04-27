import type { MqttClient } from "@repo/mqtt-client";
import { type ActuatorState, type CommandPayload, type NodeId, buildTopic } from "@repo/types";

/** Publish an MQTT command to an actuator. */
export function sendCommand(client: MqttClient, nodeId: NodeId, actuator: string, actState: ActuatorState): void {
  const topic = buildTopic({ nodeId, type: "command", name: actuator });
  const payload: CommandPayload = { state: actState };
  client.publish(topic, JSON.stringify(payload));
  console.log(`[automation] ${topic} -> ${actState}`);
}

export function doserName(direction: "low" | "high"): string {
  return direction === "low" ? "ph_up_doser" : "ph_down_doser";
}
