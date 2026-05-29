import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";

type TraverseFn = typeof import("@babel/traverse").default;
type GenerateFn = typeof import("@babel/generator").default;

const traverse: TraverseFn =
  (_traverse as unknown as { default?: TraverseFn }).default ?? (_traverse as TraverseFn);

const generate: GenerateFn =
  (_generate as unknown as { default?: GenerateFn }).default ?? (_generate as GenerateFn);

const DATA_UI_SOURCE = "data-ui-source";

export type InjectDataUiSourceOptions = {
  appRelPath: string;
};

export type InjectDataUiSourceResult = {
  code: string;
  changed: boolean;
};

export function injectDataUiSource(
  code: string,
  options: InjectDataUiSourceOptions,
): InjectDataUiSourceResult {
  const ast = parse(code, {
    sourceType: "module",
    allowReturnOutsideFunction: true,
    plugins: ["jsx", "typescript"],
  });

  let changed = false;

  traverse(ast, {
    JSXOpeningElement(nodePath) {
      const opening = nodePath.node;
      const name = opening.name;

      if (!t.isJSXIdentifier(name)) {
        return;
      }

      const first = name.name.charAt(0);

      if (first !== first.toLowerCase() || first === first.toUpperCase()) {
        return;
      }

      if (hasDataUiSourceAttribute(opening.attributes)) {
        return;
      }

      const loc = opening.loc?.start;

      if (loc === undefined) {
        return;
      }

      const line = loc.line;
      const column = loc.column + 1;
      const value = `${options.appRelPath}:${line}:${column}`;

      opening.attributes.push(
        t.jsxAttribute(t.jsxIdentifier(DATA_UI_SOURCE), t.stringLiteral(value)),
      );
      changed = true;
    },
  });

  if (!changed) {
    return { code, changed: false };
  }

  const output = generate(ast, { sourceMaps: false }, code);

  return { code: output.code, changed: true };
}

function hasDataUiSourceAttribute(
  attributes: ReadonlyArray<t.JSXAttribute | t.JSXSpreadAttribute>,
): boolean {
  return attributes.some((attr) => {
    if (!t.isJSXAttribute(attr)) {
      return false;
    }

    const attrName = attr.name;

    if (t.isJSXIdentifier(attrName)) {
      return attrName.name === DATA_UI_SOURCE;
    }

    if (t.isJSXNamespacedName(attrName)) {
      return false;
    }

    return false;
  });
}
