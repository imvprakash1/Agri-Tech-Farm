/** Proxy a GET request to an internal backend service with timeout and 502 fallback. */
export async function proxyGet(serviceUrl: string, path: string): Promise<Response> {
  try {
    const res = await fetch(`${serviceUrl}${path}`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Service unreachable" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
