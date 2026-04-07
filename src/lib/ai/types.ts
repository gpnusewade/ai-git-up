import { z } from 'zod';

export const StyleFeaturesSchema = z.object({
  vocabulary: z.array(z.string()).describe('常用词汇特征'),
  sentencePatterns: z.array(z.string()).describe('句式特点'),
  tone: z.enum(['formal', 'informal', 'neutral', 'humorous', 'serious']).describe('风格语气'),
  punctuation: z.array(z.string()).describe('标点使用特点'),
  length: z.enum(['short', 'medium', 'long']).describe('篇幅偏好'),
  perspective: z.enum(['first', 'second', 'third']).describe('人称视角'),
  characteristics: z.string().describe('整体风格描述'),
});

export type StyleFeatures = z.infer<typeof StyleFeaturesSchema>;

export const StyleFeaturesV2Schema = z.object({
  vocabulary: z.object({
    richness: z.number().min(0).max(100).describe('词汇丰富度评分（0-100）'),
    avgWordLength: z.number().describe('平均词长（字符数）'),
    uniqueWordsRatio: z.number().min(0).max(1).describe('独特词汇占比（0-1）'),
    signatureWords: z.array(z.string()).describe('标志性/高频词汇（3-8个）'),
    jargonLevel: z.enum(['none', 'low', 'medium', 'high']).describe('专业术语密度'),
  }),
  sentenceStructure: z.object({
    avgSentenceLength: z.number().describe('平均句长（字数）'),
    complexity: z.number().min(0).max(100).describe('句式复杂度评分（0-100）'),
    variety: z.number().min(0).max(100).describe('句式多样性评分（0-100）'),
    patterns: z.array(z.string()).describe('主要句式模式（如主谓宾、倒装、排比等）'),
    clauseDensity: z.number().describe('从句密度（每百字从句数）'),
  }),
  tone: z.object({
    primary: z.enum(['formal', 'informal', 'neutral', 'humorous', 'serious', 'poetic', 'technical']).describe('主要语气'),
    secondary: z.array(z.string()).describe('次要语气特征'),
    formality: z.number().min(0).max(100).describe('正式程度（0=口语化，100=书面化）'),
    emotionality: z.number().min(0).max(100).describe('情感强度（0=冷静客观，100=情感充沛）'),
    warmth: z.number().min(0).max(100).describe('亲和力（0=冷淡，100=温暖）'),
  }),
  rhetoric: z.object({
    devices: z.array(z.string()).describe('使用的修辞手法（比喻、拟人、夸张、反问等）'),
    frequency: z.number().min(0).max(100).describe('修辞密度评分（0-100）'),
    imagery: z.number().min(0).max(100).describe('意象丰富度（0-100）'),
  }),
  rhythm: z.object({
    pace: z.enum(['slow', 'moderate', 'fast', 'varied']).describe('阅读节奏'),
    cadence: z.number().min(0).max(100).describe('韵律感评分（0-100）'),
    paragraphLength: z.enum(['uniform', 'varied', 'progressive']).describe('段落长度变化模式'),
  }),
  structure: z.object({
    coherence: z.number().min(0).max(100).describe('连贯性评分（0-100）'),
    logicFlow: z.enum(['linear', 'circular', 'spiral', 'fragmented']).describe('逻辑推进方式'),
    transitionStyle: z.array(z.string()).describe('过渡方式特征'),
  }),
  punctuation: z.object({
    characteristics: z.array(z.string()).describe('标点使用特点'),
    exclamationFreq: z.number().min(0).max(100).describe('感叹号使用频率（0-100）'),
    questionFreq: z.number().min(0).max(100).describe('问号使用频率（0-100）'),
  }),
  perspective: z.object({
    primary: z.enum(['first', 'second', 'third', 'omniscient', 'mixed']).describe('主要视角'),
    distance: z.enum(['close', 'medium', 'distant']).describe('叙事距离'),
  }),
  overall: z.object({
    summary: z.string().describe('整体风格总结（100字以内）'),
    readability: z.number().min(0).max(100).describe('可读性评分（0-100）'),
    styleTags: z.array(z.string()).describe('风格标签（5-10个关键词）'),
    targetAudience: z.string().describe('目标受众推测'),
  }),
  metadata: z.object({
    textLength: z.number().describe('分析文本总字数'),
    confidence: z.number().min(0).max(100).describe('分析置信度（0-100）'),
    limitations: z.array(z.string()).optional().describe('分析局限性说明'),
  }).passthrough().describe('可扩展元数据字段'),
});

export type StyleFeaturesV2 = z.infer<typeof StyleFeaturesV2Schema>;

export type AIProvider = 'claude' | 'deepseek';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface RewriteParams {
  temperature: number;
  maxTokens: number;
  styleStrength: number;
}

export interface AnalyzeRequest {
  text: string;
  config: AIConfig;
  version?: 'v1' | 'v2';
}

export interface RewriteRequest {
  sampleText: string;
  targetText: string;
  config: AIConfig;
  params?: RewriteParams;
}

export interface AnalyzeResponse {
  style: StyleFeatures | StyleFeaturesV2;
  rawAnalysis: string;
  version: 'v1' | 'v2';
}

export interface RewriteResponse {
  rewrittenText: string;
  style: StyleFeatures;
}

export interface SimulateRequest {
  styleSourceText: string;
  targetText?: string;
  config: AIConfig;
}
