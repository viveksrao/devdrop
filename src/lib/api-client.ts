interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function postJson<T = undefined>(
  url: string,
  body?: unknown
): Promise<{ status: number; json: ApiResult<T> }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json: ApiResult<T> = await res.json();
  return { status: res.status, json };
}

export async function deleteJson<T = undefined>(
  url: string
): Promise<{ status: number; json: ApiResult<T> }> {
  const res = await fetch(url, { method: "DELETE" });
  const json: ApiResult<T> = await res.json();
  return { status: res.status, json };
}
