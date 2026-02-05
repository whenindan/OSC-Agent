import { z } from 'zod';
import { ConfigSchema } from './validator';

export type Config = z.infer<typeof ConfigSchema>;

export interface GithubConfig {
  token: string;
  owner?: string;
  repo?: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxOutputTokens?: number;
}

export interface E2BConfig {
  apiKey: string;
}

export interface TestingConfig {
  enabled: boolean;
  verbose: boolean;
  mockExternalCalls: boolean;
}
