import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';

const DEFAULT_SYSTEM_PROMPT = '你是一个友好、有帮助的AI助手。请用简洁、自然的方式回答问题。';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { messages, systemPrompt } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid messages' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.DEFAULT_DEEPSEEK_KEY;
    if (!apiKey) {
      console.error('no ApiKey');
      return
    }

    const config = {
      provider: 'deepseek' as const,
      apiKey,
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 2048,
    };

    const model = getModel(config);
    const system = systemPrompt || DEFAULT_SYSTEM_PROMPT;

    const result = streamText({
      model,
      system,
      messages,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error(error);
    return
  }
}
