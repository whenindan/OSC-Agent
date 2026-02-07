// src/agents/context-builder.ts
export interface CodeSearchResult {
  filePath: string;
  content: string;
}

export class ContextBuilder {
  /**
   * Consolidates all information into a formatted string for the LLM.
   */
  static build(issue: string, analysis: string, results: CodeSearchResult[]): string {
    const fileContext = results.map((r) => `--- FILE: ${r.filePath} ---\n${r.content}\n--- END FILE ---`).join('\n\n');

    return `
ISSUE TO FIX:
${issue}

EXPERT ANALYSIS:
${analysis}

SOURCE CODE CONTEXT:
${fileContext}
`.trim();
  }
}
