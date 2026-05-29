import path from "node:path";

const FS_PREFIX = "/@fs/";

const PLUGIN_CLIENT_DIR_SEGMENT = "/packages/vite-plugin-ui-variants/src/client/";

export type AppRelPathOptions = {
  appRoot: string;
};

export function toAppRelativeSourcePath(
  id: string,
  options: AppRelPathOptions,
): string | null {
  const absolutePath = stripQueryAndNormalize(id);

  if (absolutePath === null) {
    return null;
  }

  if (!isJsxFile(absolutePath)) {
    return null;
  }

  if (containsPluginClientPath(absolutePath)) {
    return null;
  }

  const normalizedAppRoot = path.resolve(options.appRoot);
  const rel = path.relative(normalizedAppRoot, absolutePath);

  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }

  return rel.split(path.sep).join("/");
}

function stripQueryAndNormalize(id: string): string | null {
  const withoutQuery = id.split("?")[0]?.split("#")[0] ?? "";

  if (withoutQuery === "") {
    return null;
  }

  let candidate = withoutQuery;

  if (candidate.startsWith(FS_PREFIX)) {
    candidate = candidate.slice(FS_PREFIX.length);

    if (!candidate.startsWith("/")) {
      candidate = `/${candidate}`;
    }
  }

  if (!path.isAbsolute(candidate)) {
    return null;
  }

  return path.normalize(candidate);
}

function isJsxFile(absolutePath: string): boolean {
  return absolutePath.endsWith(".tsx") || absolutePath.endsWith(".jsx");
}

function containsPluginClientPath(absolutePath: string): boolean {
  return absolutePath.replaceAll(path.sep, "/").includes(PLUGIN_CLIENT_DIR_SEGMENT);
}
