import { generateText } from 'ai';
import { getModel } from '../ai/providers';
import { STYLE_REWRITE_PROMPT } from '../ai/prompts';
import type { AIConfig, StyleFeatures } from '../ai/types';

export async function rewriteText(
  targetText: string,
  style: StyleFeatures,
  config: AIConfig
): Promise<string> {
  const model = getModel(config);

  const prompt = STYLE_REWRITE_PROMPT
    .replace('{vocabulary}', style.vocabulary.join(', '))
    .replace('{sentencePatterns}', style.sentencePatterns.join(', '))
    .replace('{tone}', style.tone)
    .replace('{punctuation}', style.punctuation.join(', '))
    .replace('{length}', style.length)
    .replace('{perspective}', style.perspective)
    .replace('{characteristics}', style.characteristics);

  const { text } = await generateText({
    model,
    system: '你是一个文字风格模仿大师。请直接输出改写后的文本。',
    prompt: prompt + '\n\n' + targetText,
    temperature: config.temperature ?? 0.7,
    maxOutputTokens: config.maxTokens ?? 2000,
  });

  return text;
}
