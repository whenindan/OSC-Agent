/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GeminiClient } from './gemini-client';
import { getFixGenerationPrompt, FixStrategy } from './prompts/fix-generation';
import { ContextBuilder, CodeSearchResult } from './context-builder';
import { CodeChange, DiffGenerator } from './diff-generator';

export interface FixProposal {
  explanation: string;
  confidenceScore: number;
  patches: string[];
  strategy: FixStrategy;
  usage?: unknown; // To pass through Gemini usage metrics
}

export class FixGenerator {
  constructor(private client: GeminiClient) {}

  async generateFix(issueDescription: string, analysis: string, searchResults: CodeSearchResult[], strategy: FixStrategy = 'minimal'): Promise<FixProposal> {
    const context = ContextBuilder.build(issueDescription, analysis, searchResults);
    const prompt = getFixGenerationPrompt(issueDescription, analysis, context, strategy);

    // Call your GeminiClient
    const response = await this.client.generate(prompt, {
      temperature: 0.2, // Low temperature for consistent code generation
      useCache: true,
    });

    const parsedOutput = this.parseResponse(response.content);

    const patches = parsedOutput.changes
      .map((change: CodeChange) => {
        const sourceFile = searchResults.find((r) => r.filePath === change.filePath);
        if (!sourceFile) return '';

        try {
          return DiffGenerator.generate(change, sourceFile.content);
        } catch (e) {
          console.error(`Diff failed for ${change.filePath}:`, e);
          return '';
        }
      })
      .filter((p: string) => p !== '');

    return {
      explanation: parsedOutput.explanation,
      confidenceScore: parsedOutput.confidenceScore,
      patches,
      strategy,
      usage: response.usage,
    };
  }

  private parseResponse(content: string) {
    try {
      // Remove markdown code blocks if Gemini accidentally included them
      const cleaned = content.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Failed to parse AI fix proposal as JSON. Content: ' + content);
    }
  }
}
