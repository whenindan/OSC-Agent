import { Config } from '../config/validator';
import { IssueAnalysis, IssueAnalysisSchema } from './types';
import { buildIssueAnalysisPrompt } from './prompts/issue-analysis';
import { GeminiClient } from './gemini-client';
import { ModelTier as GeminiModelTier } from '../types/gemini';
import { GitHubIssue } from '../github/types';

type ModelTier = 'auto' | 'basic' | 'advanced';

export class IssueAnalyzer {
  private readonly modelTier: ModelTier;
  private readonly gemini: GeminiClient;

  constructor(config: Pick<Config, 'gemini'>, geminiClient?: GeminiClient) {
    this.modelTier = config.gemini.model_tier;
    this.gemini = geminiClient ?? new GeminiClient(config.gemini.api_key);
  }

  async analyzeIssue(issue: GitHubIssue): Promise<IssueAnalysis> {
    const title = issue.title;
    const body = issue.body ?? '';
    const labels = (issue.labels ?? []).map((l: { name?: string }) => l.name).filter((n: string | undefined): n is string => typeof n === 'string' && n.length > 0);

    const prompt = buildIssueAnalysisPrompt({ title, body, labels });

    const text = await this.generateText(prompt);
    const jsonText = extractJsonObject(text);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      throw new Error(`IssueAnalyzer: failed to parse model JSON output. Raw output: ${text}`, {
        cause: err,
      });
    }

    const validated = IssueAnalysisSchema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(`IssueAnalyzer: invalid analysis schema: ${validated.error.message}`);
    }

    return validated.data;
  }

  private async generateText(prompt: string): Promise<string> {
    const response = await this.gemini.generate(prompt, {
      temperature: 0.2,
      modelTier: mapTier(this.modelTier),
      taskComplexity: this.modelTier === 'advanced' ? 'high' : 'medium',
      useCache: false,
    });

    const text = typeof response.content === 'string' ? response.content : String(response.content);
    if (!text) {
      throw new Error('IssueAnalyzer: Gemini client returned empty text');
    }

    return text;
  }
}

function mapTier(tier: ModelTier): GeminiModelTier | undefined {
  switch (tier) {
    case 'basic':
      return 'flash';
    case 'advanced':
      return 'pro';
    case 'auto':
    default:
      return undefined;
  }
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();

  // Remove fenced code blocks if the model included them.
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const unfenced = fenceMatch?.[1] ? fenceMatch[1].trim() : trimmed;

  // Try to locate the first JSON object.
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return unfenced;
  }

  return unfenced.slice(start, end + 1);
}
