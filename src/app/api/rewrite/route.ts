import { NextRequest, NextResponse } from 'next/server';
import { analyzeStyle } from '@/lib/services/style-analyzer';
import { rewriteText } from '@/lib/services/text-rewriter';
import type { RewriteRequest, RewriteResponse } from '@/lib/ai/types';
import { log, extractFingerprint, logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: RewriteRequest = await request.json();
    const { sampleText, targetText, config, params } = body;

    if (!sampleText || !targetText || !config || !config.apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analysisConfig = {
      ...config,
      temperature: params?.temperature ?? config.temperature ?? 0.7,
      maxTokens: params?.maxTokens ?? config.maxTokens ?? 2000,
    };

    const model = config.model || (config.provider === 'claude' ? 'claude-3-haiku-20240307' : 'deepseek-chat');
    const temperature = params?.temperature ?? config.temperature ?? 0.7;
    const maxTokens = params?.maxTokens ?? config.maxTokens ?? 2000;

    const style = await analyzeStyle(sampleText, analysisConfig);
    const rewrittenText = await rewriteText(targetText, style, analysisConfig);

    log('rewrite.request', {
      model,
      provider: config.provider,
      temperature,
      maxTokens,
      duration: Date.now() - startTime,
    });

    const response: RewriteResponse = {
      rewrittenText,
      style,
    };

    return NextResponse.json(response);
  } catch (error) {
    logError('rewrite.error', error, { duration: Date.now() - startTime });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rewrite failed' },
      { status: 500 }
    );
  }
}
