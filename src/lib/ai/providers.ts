import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import type { LanguageModel } from 'ai';
import type { AIConfig, AIProvider } from './types';

export function getModel(config: AIConfig): LanguageModel {
  const { provider, apiKey, baseUrl, model } = config;

  switch (provider) {
    case 'claude': {
      const anthropic = createAnthropic({
        apiKey,
        ...(baseUrl && { baseURL: baseUrl }),
      });
      return anthropic(model || 'claude-3-haiku-20240307');
    }

    case 'deepseek': {
      const deepseek = createDeepSeek({
        apiKey,
        ...(baseUrl && { baseURL: baseUrl }),
      });
      return deepseek(model || 'deepseek-chat');
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function getProviderDisplayName(provider: AIProvider): string {
  switch (provider) {
    case 'claude':
      return 'Claude (Anthropic)';
    case 'deepseek':
      return 'DeepSeek';
    default:
      return provider;
  }
}

export const SUPPORTED_PROVIDERS: AIProvider[] = ['claude', 'deepseek'];
