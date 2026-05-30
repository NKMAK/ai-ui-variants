export type SourceLocation = {
  file: string;
  line: number;
  column: number;
};

export type FileEdit = {
  search: string;
  replace: string;
};

export type FileChange = {
  file: string;
  edits: FileEdit[];
};

export type VariantOutput = {
  title: string;
  description: string;
  changes: FileChange[];
};

export type UiVariantGeneratorKind = "mock" | "claude-code";
export type GenerateMode = "replace" | "refine";

export type TokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  totalTokens?: number;
};

export type GenerationMetadata = {
  model: string;
  tokenUsage?: TokenUsage;
};

export type UiVariantsOptions = {
  appRoot?: string;
  generator?: UiVariantGeneratorKind;
  promptTemplatePath?: string;
  promptContextPaths?: string[];
};

export type VariantStatus = "pending" | "ready" | "previewing" | "applied" | "failed";

export type Variant = VariantOutput & {
  id: string;
  status: VariantStatus;
  patchPath?: string;
  error?: string;
};

export type SessionStatus =
  | "idle"
  | "generating"
  | "ready"
  | "previewing"
  | "applied"
  | "discarded"
  | "failed";

export type Session = {
  id: string;
  source: SourceLocation;
  instruction: string;
  generation?: GenerationMetadata;
  baseSnapshot: Record<string, string>;
  variants: Variant[];
  currentIndex: number;
  locked: boolean;
  status: SessionStatus;
  createdAt: string;
};

export type ApiErrorResponse = {
  ok: false;
  error: string;
};

export type StartSessionRequest = {
  source: SourceLocation;
  instruction: string;
};

export type StartSessionResponse = {
  ok: true;
  session: Session;
};

export type GenerateVariantsRequest = {
  sessionId: string;
  instruction: string;
  count?: number;
  mode?: GenerateMode;
  model?: string;
};

export type GenerateVariantsResponse = {
  ok: true;
  session: Session;
  variants: Variant[];
};

export type PreviewVariantRequest = {
  sessionId: string;
  variantId: string;
};

export type PreviewVariantResponse = {
  ok: true;
  session: Session;
  currentVariant: Variant;
};

export type ApplyVariantRequest = {
  sessionId: string;
  variantId: string;
};

export type ApplyVariantResponse = {
  ok: true;
  session: Session;
  appliedVariant: Variant;
};

export type DiscardSessionRequest = {
  sessionId: string;
};

export type DiscardSessionResponse = {
  ok: true;
  session: Session;
};

export type GetSessionResponse = {
  ok: true;
  session: Session | null;
};

export type ApiResponse<T> = T | ApiErrorResponse;
