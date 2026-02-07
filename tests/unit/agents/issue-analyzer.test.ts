import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { IssueAnalyzer } from '../../../src/agents/issue-analyzer';
import { Config } from '../../../src/config/validator';
import { GitHubIssue } from '../../../src/github/types';
import type { GeminiRequestOptions, GeminiResponse } from '../../../src/types/gemini';

type GenerateFn = (prompt: string, options?: GeminiRequestOptions) => Promise<GeminiResponse<string>>;

const generateMock = jest.fn<GenerateFn>();

jest.mock('../../../src/agents/gemini-client', () => ({
  GeminiClient: jest.fn().mockImplementation(() => ({
    generate: generateMock,
  })),
}));

describe('IssueAnalyzer', () => {
  const baseConfig: Pick<Config, 'gemini'> = {
    gemini: {
      api_key: 'test-key',
      model_tier: 'basic',
    },
  };

  beforeEach(() => {
    generateMock.mockReset();
  });

  it('returns structured analysis for minimal issue', async () => {
    generateMock.mockResolvedValue({
      content: JSON.stringify({
        type: 'feature',
        complexity: 'simple',
        requirements: ['Add a button'],
        affected_files: ['src/index.ts'],
      }),
      usage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0, estimatedCost: 0, modelId: 'gemini-3-flash' },
      modelId: 'gemini-3-flash',
      cached: false,
    });

    const analyzer = new IssueAnalyzer(baseConfig);
    const issue: GitHubIssue = {
      id: 101,
      number: 1,
      title: 'App crashes on startup',
      body: 'It crashes when I run it.',
      state: 'open',
      user: { login: 'tester' },
      created_at: '2026-01-01T00:00:00Z',
      labels: [{ name: 'bug' }],
    };

    const result = await analyzer.analyzeIssue(issue);

    expect(result.type).toBe('feature');
    expect(result.complexity).toBe('simple');
    expect(result.requirements.length).toBeGreaterThan(0);
  });

  it('parses fenced JSON output from model', async () => {
    generateMock.mockResolvedValue({
      content:
        '```json\n' +
        JSON.stringify({
          type: 'bug',
          complexity: 'medium',
          requirements: ['Fix crash'],
          affected_files: ['src/app.ts'],
        }) +
        '\n```',
      usage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0, estimatedCost: 0, modelId: 'gemini-3-flash' },
      modelId: 'gemini-3-flash',
      cached: false,
    });

    const analyzer = new IssueAnalyzer(baseConfig);
    const issue: GitHubIssue = {
      id: 102,
      number: 2,
      title: 'Add dry run mode',
      body: 'Please add a dry-run flag.\n\n```ts\nconsole.log("hello")\n```',
      state: 'open',
      user: { login: 'tester' },
      created_at: '2026-01-02T00:00:00Z',
      labels: [{ name: 'enhancement' }],
    };

    const result = await analyzer.analyzeIssue(issue);

    expect(result.type).toBe('bug');
    expect(result.affected_files).toContain('src/app.ts');
  });

  it('throws on invalid schema', async () => {
    generateMock.mockResolvedValue({
      content: JSON.stringify({
        type: 'feature',
        complexity: 'simple',
        requirements: 'should be array',
        affected_files: [],
      }),
      usage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0, estimatedCost: 0, modelId: 'gemini-3-flash' },
      modelId: 'gemini-3-flash',
      cached: false,
    });

    const analyzer = new IssueAnalyzer(baseConfig);
    const issue: GitHubIssue = {
      id: 103,
      number: 3,
      title: 'Bad output test',
      body: '',
      state: 'open',
      user: { login: 'tester' },
      created_at: '2026-01-03T00:00:00Z',
    };

    await expect(analyzer.analyzeIssue(issue)).rejects.toThrow(/invalid analysis schema/i);
  });

  it('throws when model output is not JSON', async () => {
    generateMock.mockResolvedValue({
      content: 'not json',
      usage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0, estimatedCost: 0, modelId: 'gemini-3-flash' },
      modelId: 'gemini-3-flash',
      cached: false,
    });

    const analyzer = new IssueAnalyzer(baseConfig);
    const issue: GitHubIssue = {
      id: 106,
      number: 6,
      title: 'Some issue',
      body: 'Some body',
      state: 'open',
      user: { login: 'tester' },
      created_at: '2026-01-06T00:00:00Z',
      labels: [],
    };

    await expect(analyzer.analyzeIssue(issue)).rejects.toThrow(/failed to parse model JSON output/i);
  });

  it('propagates Gemini client errors', async () => {
    generateMock.mockRejectedValue(new Error('Gemini is down'));

    const analyzer = new IssueAnalyzer(baseConfig);
    const issue: GitHubIssue = {
      id: 107,
      number: 7,
      title: 'Some issue',
      body: 'Some body',
      state: 'open',
      user: { login: 'tester' },
      created_at: '2026-01-07T00:00:00Z',
      labels: [],
    };

    await expect(analyzer.analyzeIssue(issue)).rejects.toThrow('Gemini is down');
  });
});
