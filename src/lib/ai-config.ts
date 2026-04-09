import { openai } from '@ai-sdk/openai';

export const aiConfig = {
  openai: openai({
    apiKey: process.env.OPENAI_API_KEY || '',
  }),
};

export const modelConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2000,
};
