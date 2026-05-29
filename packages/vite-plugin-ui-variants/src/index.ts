import path from "node:path";

import type { IndexHtmlTransformResult, Plugin } from "vite";

import { API_BASE } from "./constants.ts";
import { createRouter } from "./server/router.ts";
import type { UiVariantsOptions } from "./shared/types.ts";
import { injectDataUiSource } from "./transform/dataUiSource.ts";
import { toAppRelativeSourcePath } from "./transform/path.ts";

export type { UiVariantsOptions };

const OVERLAY_MODULE_ID = "virtual:ui-variants-overlay";
const RESOLVED_OVERLAY_MODULE_ID = `\0${OVERLAY_MODULE_ID}`;

export function uiVariants(options?: UiVariantsOptions): Plugin {
  let appRoot = "";

  return {
    name: "ui-variants",
    apply: "serve",
    enforce: "pre",
    configResolved(config) {
      appRoot = options?.appRoot ?? config.root;
    },
    resolveId(id) {
      if (id === OVERLAY_MODULE_ID) {
        return RESOLVED_OVERLAY_MODULE_ID;
      }

      return null;
    },
    load(id) {
      if (id !== RESOLVED_OVERLAY_MODULE_ID) {
        return null;
      }

      const entryPath = path
        .resolve(import.meta.dirname, "client/index.tsx")
        .replaceAll(path.sep, "/");

      return `import ${JSON.stringify(`/@fs/${entryPath}`)};`;
    },
    transform(code, id) {
      if (appRoot === "") {
        return null;
      }

      const appRelPath = toAppRelativeSourcePath(id, { appRoot });

      if (appRelPath === null) {
        return null;
      }

      const result = injectDataUiSource(code, { appRelPath });

      if (!result.changed) {
        return null;
      }

      return { code: result.code, map: null };
    },
    configureServer(server) {
      server.middlewares.use(API_BASE, createRouter(server, options));
    },
    transformIndexHtml(): IndexHtmlTransformResult {
      return [
        {
          tag: "script",
          attrs: {
            type: "module",
            src: `/@id/${OVERLAY_MODULE_ID}`,
          },
          injectTo: "body",
        },
      ];
    },
  };
}
