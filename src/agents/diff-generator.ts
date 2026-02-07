// src/agents/diff-generator.ts
import { createPatch } from 'diff';

export interface CodeChange {
  filePath: string;
  originalCode: string;
  replacementCode: string;
}

export class DiffGenerator {
  static generate(change: CodeChange, fullFileContent: string): string {
    // If the full file content is provided, we can generate a high-quality unified diff
    // For this implementation, we apply the change to the full content then diff the two versions
    const updatedContent = fullFileContent.replace(change.originalCode, change.replacementCode);

    if (updatedContent === fullFileContent) {
      throw new Error(`Could not find original code block in ${change.filePath}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
    return createPatch(change.filePath, fullFileContent, updatedContent);
  }
}
