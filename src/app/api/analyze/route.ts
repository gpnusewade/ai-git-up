import { NextRequest, NextResponse } from 'next/server';
import { analyzeStyle, analyzeStyleV2 } from '@/lib/services/style-analyzer';
import type { AnalyzeRequest, AnalyzeResponse } from '@/lib/ai/types';
import { log, extractFingerprint, logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: AnalyzeRequest = await request.json();
    const { text, config, version = 'v1' } = body;

    if (!text || !config || !config.apiKey) {
      return NextResponse.json(
        { error: 'Missing text or config' },
        { status: 400 }
      );
    }

    const style = version === 'v2'
      ? await analyzeStyleV2(text, config)
      : await analyzeStyle(text, config);

    const model = config.model || (config.provider === 'claude' ? 'claude-3-haiku-20240307' : 'deepseek-chat');
    const temperature = config.temperature ?? (version === 'v2' ? 0.3 : 0.7);
    const maxTokens = config.maxTokens ?? (version === 'v2' ? 4000 : 2000);

    const logData: Record<string, unknown> = {
      version,
      model,
      provider: config.provider,
      temperature,
      maxTokens,
      duration: Date.now() - startTime,
    };

    if (version === 'v2') {
      const v2Style = style as Awaited<ReturnType<typeof analyzeStyleV2>>;
      logData.style = v2Style;
    } else {
      const v1Style = style as Awaited<ReturnType<typeof analyzeStyle>>;
      logData.style = v1Style;
    }

    log('analyze.request', logData);

    const response: AnalyzeResponse = {
      style,
      rawAnalysis: JSON.stringify(style, null, 2),
      version,
    };

    return NextResponse.json(response);
  } catch (error) {
    logError('analyze.error', error, { duration: Date.now() - startTime });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
