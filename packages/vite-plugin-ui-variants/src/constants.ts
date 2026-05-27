export const API_BASE = "/__ui_agent";

export const API_ENDPOINTS = {
  session: `${API_BASE}/session`,
  generate: `${API_BASE}/generate`,
  preview: `${API_BASE}/preview`,
  apply: `${API_BASE}/apply`,
  discard: `${API_BASE}/discard`,
} as const;

export const DENYLIST = [
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lockb",
  ".env",
  ".env.*",
  "**/*auth*",
  "**/*billing*",
  "**/*migration*",
  "**/migrations/**",
  "**/infra/**",
  ".github/**",
] as const;

export const MAX_FILES = 3;
export const MAX_DIFF_LINES = 100;
