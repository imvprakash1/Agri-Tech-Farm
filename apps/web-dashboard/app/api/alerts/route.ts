const ALERTS_URL = process.env.ALERTS_SERVICE_URL ?? "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${ALERTS_URL}/status`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "alerts-service unreachable" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
