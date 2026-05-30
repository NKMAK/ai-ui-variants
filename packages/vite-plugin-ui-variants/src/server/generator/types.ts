import type {
  GenerationMetadata,
  SourceLocation,
  VariantOutput,
} from "../../shared/types.ts";

export type CodeRange = {
  file: string;
  startLine: number;
  endLine: number;
  selectedLine: number;
  targetStartLine: number;
  targetEndLine: number;
  content: string;
};

export type GenerateVariantsInput = {
  instruction: string;
  selectedSource: SourceLocation;
  codeRange: CodeRange;
  callerSource?: SourceLocation;
  count: number;
  model?: string;
};

export type GenerateVariantsResult = {
  outputs: VariantOutput[];
  generation: GenerationMetadata;
};

export interface VariantGenerator {
  generate(input: GenerateVariantsInput): Promise<GenerateVariantsResult>;
}
