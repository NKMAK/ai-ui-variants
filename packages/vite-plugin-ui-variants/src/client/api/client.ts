import { API_ENDPOINTS } from "../../constants.ts";
import type {
  ApplyVariantResponse,
  ApiResponse,
  DiscardSessionResponse,
  GenerateVariantsResponse,
  PreviewVariantResponse,
  SourceLocation,
  StartSessionRequest,
  StartSessionResponse,
} from "../../shared/types.ts";

export async function postStart(
  source: SourceLocation,
  instruction = "",
): Promise<ApiResponse<StartSessionResponse>> {
  return postJson<ApiResponse<StartSessionResponse>>(`${API_ENDPOINTS.session}/start`, {
    source,
    instruction,
  });
}

export async function postGenerate(
  activeSessionId: string,
  instruction: string,
  count: number,
): Promise<ApiResponse<GenerateVariantsResponse>> {
  return postJson<ApiResponse<GenerateVariantsResponse>>(
    `${API_ENDPOINTS.session}/${activeSessionId}/generate-variants`,
    { instruction, count },
  );
}

export async function postPreview(
  activeSessionId: string,
  variantId: string,
): Promise<ApiResponse<PreviewVariantResponse>> {
  return postJson<ApiResponse<PreviewVariantResponse>>(
    `${API_ENDPOINTS.session}/${activeSessionId}/preview/${variantId}`,
    {},
  );
}

export async function postApply(
  activeSessionId: string,
  variantId: string,
): Promise<ApiResponse<ApplyVariantResponse>> {
  return postJson<ApiResponse<ApplyVariantResponse>>(
    `${API_ENDPOINTS.session}/${activeSessionId}/apply/${variantId}`,
    {},
  );
}

export async function postDiscard(
  activeSessionId: string,
): Promise<ApiResponse<DiscardSessionResponse>> {
  return postJson<ApiResponse<DiscardSessionResponse>>(
    `${API_ENDPOINTS.session}/${activeSessionId}/discard`,
    {},
  );
}

async function postJson<TResponse>(
  url: string,
  body: StartSessionRequest | Record<string, unknown>,
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
