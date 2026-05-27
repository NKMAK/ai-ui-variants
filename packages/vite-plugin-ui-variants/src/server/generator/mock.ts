import type { VariantOutput } from "../../shared/types";
import type { GenerateVariantsInput, VariantGenerator } from "./types";

export class MockGenerator implements VariantGenerator {
  async generate(input: GenerateVariantsInput): Promise<VariantOutput[]> {
    const file = input.selectedSource.file;
    const variants: VariantOutput[] = [
      {
        title: "Variant A",
        description: "ボタンの文言を少し明確にする",
        changes: [
          {
            file,
            edits: [
              {
                search: "      保存",
                replace: "      保存する",
              },
            ],
          },
        ],
      },
      {
        title: "Variant B",
        description: "ボタンに強調用の className を追加する",
        changes: [
          {
            file,
            edits: [
              {
                search:
                  '    <button type="button" data-ui-source="src/components/SaveButton.tsx:3:5">',
                replace:
                  '    <button type="button" className="primary-action" data-ui-source="src/components/SaveButton.tsx:3:5">',
              },
            ],
          },
        ],
      },
      {
        title: "Variant C",
        description: "ボタンに大きめの className を追加する",
        changes: [
          {
            file,
            edits: [
              {
                search:
                  '    <button type="button" data-ui-source="src/components/SaveButton.tsx:3:5">',
                replace:
                  '    <button type="button" className="large-action" data-ui-source="src/components/SaveButton.tsx:3:5">',
              },
            ],
          },
        ],
      },
    ];

    return variants.slice(0, input.count);
  }
}
