import path from "node:path";

import type { IndexHtmlTransformResult, Plugin } from "vite";

import { API_BASE } from "./constants.ts";
import { createRouter, type UiVariantsOptions } from "./server/router.ts";

export type { UiVariantsOptions };

const OVERLAY_MODULE_ID = "virtual:ui-variants-overlay";
const RESOLVED_OVERLAY_MODULE_ID = `\0${OVERLAY_MODULE_ID}`;

export function uiVariants(options?: UiVariantsOptions): Plugin {
  return {
    name: "ui-variants",
    apply: "serve",
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
