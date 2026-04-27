import { proxyGet } from "@/app/lib/proxy";

const AUTOMATION_URL = process.env.AUTOMATION_ENGINE_URL ?? "http://localhost:3002";

export async function GET() {
  return proxyGet(AUTOMATION_URL, "/status");
}
