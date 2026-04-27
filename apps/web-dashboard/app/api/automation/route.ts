const AUTOMATION_URL = process.env.AUTOMATION_ENGINE_URL ?? "http://localhost:3002";

export async function GET() {
  try {
    const res = await fetch(`${AUTOMATION_URL}/status`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "automation-engine unreachable" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
