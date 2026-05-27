import { API_ENDPOINTS } from "../../constants.ts";
import type {
  ApiResponse,
  SourceLocation,
  StartSessionRequest,
  StartSessionResponse,
} from "../../shared/types.ts";

export async function postStart(
  source: SourceLocation,
  instruction = "",
): Promise<ApiResponse<StartSessionResponse>> {
  return postJson<ApiResponse<StartSessionResponse>>(
    `${API_ENDPOINTS.session}/start`,
    { source, instruction },
  );
}

async function postJson<TResponse>(
  url: string,
  body: StartSessionRequest,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return (await response.json()) as TResponse;
}
