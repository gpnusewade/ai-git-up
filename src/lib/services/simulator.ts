import { streamText } from 'ai';
import { getModel } from '../ai/providers';
import { SIMULATE_PROMPT } from '../ai/prompts';
import type { AIConfig } from '../ai/types';

export function simulateStyle(
  styleSourceText: string,
  targetText: string | undefined,
  config: AIConfig
) {
  const model = getModel(config);

  let inputPrompt = `<风格源文案>\n${styleSourceText}\n</风格源文案>`;

  if (targetText) {
    inputPrompt += `\n\n<目标文案>\n${targetText}\n</目标文案>`;
  }

  return streamText({
    model,
    prompt: SIMULATE_PROMPT + '\n\n' + inputPrompt,
    temperature: config.temperature ?? 0.3,
    maxOutputTokens: config.maxTokens ?? 4000,
  });
}
