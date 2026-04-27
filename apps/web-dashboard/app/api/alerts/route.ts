import { proxyGet } from "@/app/lib/proxy";

const ALERTS_URL = process.env.ALERTS_SERVICE_URL ?? "http://localhost:3001";

export async function GET() {
  return proxyGet(ALERTS_URL, "/status");
}
