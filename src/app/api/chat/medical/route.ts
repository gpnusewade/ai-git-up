import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { getMedicalSystemPrompt } from '@/lib/ai/medical-prompt';
import { searchDoctors, suggestInsurance, getContactInfo } from '@/lib/ai/medical-tools';
import { decrypt } from '@/lib/crypto/rsa';
import { getPrivateKey } from './keys';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, locale, encryptedToken } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid messages' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.DEFAULT_DEEPSEEK_KEY;
    if (!apiKey) {
      console.error('no key');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const privateKey = getPrivateKey();

    const config = {
      provider: 'deepseek' as const,
      apiKey,
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 2048,
    };

    const model = getModel(config);
    const system = getMedicalSystemPrompt(locale || 'zh-CN');

    const result = streamText({
      model,
      system,
      messages,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      tools: {
        recommend_doctors: {
          description: '根据用户症状和位置推荐合适的医生',
          inputSchema: z.object({
            location: z.string().describe('用户所在城市'),
            symptoms: z.string().describe('用户描述的症状'),
          }),
          execute: async (params: { location: string; symptoms: string }) => {
            const token = await decrypt(privateKey, encryptedToken);
            const doctors = await searchDoctors(params.location, params.symptoms, token);
            return { doctors };
          },
        },
        suggest_insurance: {
          description: '根据用户情况推荐保险方案',
          inputSchema: z.object({
            symptoms: z.string().optional().describe('用户症状'),
            insuranceStatus: z.string().optional().describe('保险状态'),
          }),
          execute: async (params: { symptoms?: string; insuranceStatus?: string }) => {
            const token = await decrypt(privateKey, encryptedToken);
            const plans = await suggestInsurance(params.symptoms || '', params.insuranceStatus || 'unknown', token);
            return { plans };
          },
        },
        get_contact_info: {
          description: '获取客服联系方式',
          inputSchema: z.object({
            type: z.string().optional().describe('联系方式类型：emergency/hotline/online/appointment'),
          }),
          execute: async (params: { type?: string }) => {
            const contacts = await getContactInfo(params.type);
            return { contacts };
          },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('medical.error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Medical chat failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
