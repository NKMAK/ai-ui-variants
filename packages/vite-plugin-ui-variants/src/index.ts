import type { Plugin } from "vite";

import { API_BASE } from "./constants.ts";
import { createRouter, type UiVariantsOptions } from "./server/router.ts";

export type { UiVariantsOptions };

export function uiVariants(options?: UiVariantsOptions): Plugin {
  return {
    name: "ui-variants",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(API_BASE, createRouter(server, options));
    },
  };
}
