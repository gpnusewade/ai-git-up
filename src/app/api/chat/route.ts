import { NextRequest } from 'next/server';
import { MedicalAgent } from '@/agents/medical-agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Expected a user message', { status: 400 });
    }

    const agent = new MedicalAgent();
    const result = await agent.generateResponse(lastMessage.content);

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
