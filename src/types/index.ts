export interface StyleFeatures {
  vocabulary: string[];
  sentencePatterns: string[];
  tone: 'formal' | 'informal' | 'neutral' | 'humorous' | 'serious';
  punctuation: string[];
  length: 'short' | 'medium' | 'long';
  perspective: 'first' | 'second' | 'third';
  characteristics: string;
}

export interface StyleFeaturesV2 {
  vocabulary: {
    richness: number;
    avgWordLength: number;
    uniqueWordsRatio: number;
    signatureWords: string[];
    jargonLevel: 'none' | 'low' | 'medium' | 'high';
  };
  sentenceStructure: {
    avgSentenceLength: number;
    complexity: number;
    variety: number;
    patterns: string[];
    clauseDensity: number;
  };
  tone: {
    primary: 'formal' | 'informal' | 'neutral' | 'humorous' | 'serious' | 'poetic' | 'technical';
    secondary: string[];
    formality: number;
    emotionality: number;
  };
  length: {
    avgParagraphLength: number;
    paragraphLength: 'uniform' | 'varied' | 'progressive';
  };
  structure: {
    coherence: number;
    logicFlow: 'linear' | 'circular' | 'spiral' | 'fragmented';
    transitionStyle: string[];
  };
  punctuation: {
    characteristics: string[];
    exclamationFreq: number;
    questionFreq: number;
  };
  perspective: {
    primary: 'first' | 'second' | 'third' | 'omniscient' | 'mixed';
    distance: 'close' | 'medium' | 'distant';
  };
  overall: {
    summary: string;
    readability: number;
    styleTags: string[];
    targetAudience: string;
  };
  metadata: {
    textLength: number;
    confidence: number;
    limitations?: string[];
    [key: string]: unknown;
  };
}

export interface LLMConfig {
  provider: 'claude' | 'deepseek';
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
  config: LLMConfig;
}

export interface RewriteRequest {
  sampleText: string;
  targetText: string;
  config: LLMConfig;
  params: RewriteParams;
}

export interface AnalyzeResponse {
  style: StyleFeatures;
  rawAnalysis: string;
}

export interface RewriteResponse {
  rewrittenText: string;
  style: StyleFeatures;
}

export type FeatureType = 'analyze' | 'rewrite' | 'simulate';

export interface AnalyzeFeedbackDimensions {
  accuracy: number;
  usefulness: number;
  detail: number;
}

export interface RewriteFeedbackDimensions {
  quality: number;
  styleMatch: number;
  readability: number;
}

export interface SimulateFeedbackDimensions {
  reportQuality: number;
  practicality: number;
  readability: number;
  imitationQuality: number;
  styleMatch: number;
}

export interface FeedbackData {
  featureType: FeatureType;
  dimensions: AnalyzeFeedbackDimensions | RewriteFeedbackDimensions | SimulateFeedbackDimensions;
  comment: string;
  timestamp: string;
  analyzeResult: StyleFeatures | StyleFeaturesV2 | null;
  rewriteResult: string | null;
  simulateResult: string | null;
}