import { generateText, Output } from 'ai';
import { getModel } from '../ai/providers';
import { STYLE_ANALYSIS_PROMPT, STYLE_ANALYSIS_PROMPT_V2 } from '../ai/prompts';
import { StyleFeaturesSchema, StyleFeaturesV2Schema, type AIConfig, type StyleFeatures, type StyleFeaturesV2 } from '../ai/types';

export async function analyzeStyle(text: string, config: AIConfig): Promise<StyleFeatures> {
  const model = getModel(config);

  const { output } = await generateText({
    model,
    system: '你是一个文字风格分析专家。请用JSON格式返回分析结果，不要添加任何其他内容。',
    prompt: STYLE_ANALYSIS_PROMPT + text,
    output: Output.object({
      schema: StyleFeaturesSchema,
    }),
    temperature: config.temperature ?? 0.7,
    maxOutputTokens: config.maxTokens ?? 2000,
  });

  return output;
}

export async function analyzeStyleV2(text: string, config: AIConfig): Promise<StyleFeaturesV2> {
  const model = getModel(config);

  const { output } = await generateText({
    model,
    system: '你是一位资深的NLP内容分析顾问。请严格按JSON Schema返回量化分析报告，不要添加任何其他内容。',
    prompt: STYLE_ANALYSIS_PROMPT_V2 + text,
    output: Output.object({
      schema: StyleFeaturesV2Schema,
    }),
    temperature: config.temperature ?? 0.3,
    maxOutputTokens: config.maxTokens ?? 4000,
  });

  return output;
}
