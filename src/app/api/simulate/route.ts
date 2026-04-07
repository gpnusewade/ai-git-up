import { NextRequest } from 'next/server';
import { simulateStyle } from '@/lib/services/simulator';
import type { SimulateRequest } from '@/lib/ai/types';
import { log, extractFingerprint, logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: SimulateRequest = await request.json();
    const { styleSourceText, targetText, config } = body;

    if (!styleSourceText || !config) {
      return new Response(
        JSON.stringify({ error: 'Missing styleSourceText or config' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const model = config.model || (config.provider === 'claude' ? 'claude-3-haiku-20240307' : 'deepseek-chat');
    const temperature = config.temperature ?? 0.3;
    const maxTokens = config.maxTokens ?? 4000;

    if (!config.apiKey) {
      config.provider = 'deepseek';
      config.apiKey = process.env.DEFAULT_DEEPSEEK_KEY || '';
    }

    if (!config.apiKey) {
      logError('simulate.config', new Error('API key not provided'));
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = simulateStyle(styleSourceText, targetText, config);

    log('simulate.request', {
      model,
      provider: config.provider,
      temperature,
      maxTokens,
      hasTargetText: !!targetText,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError('simulate.error', error, { duration: Date.now() - startTime });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Simulation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
