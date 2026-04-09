import { streamText } from 'ai';
import { aiConfig, modelConfig } from '@/lib/ai-config';
import type { MedicalAgentConfig, ChatMessage, AgentResponse } from '@/types/agent';

const MEDICAL_SYSTEM_PROMPT = `你是一个专业的医疗客服助手，具有以下特点：

1. 专业性：拥有丰富的医学知识和经验，能够回答各种医疗相关问题
2. 安全性：始终强调这些建议仅供参考，不能替代专业医生的诊断和治疗
3. 同理心：对患者的问题表示关心和理解
4. 清晰性：用简单易懂的语言解释复杂的医学概念
5. 责任感：遇到超出能力范围的问题，会建议患者及时就医

请用中文回答用户的问题，并在每次回答末尾提醒用户：本回答仅供参考，不能替代专业医生的建议。`;

const MEDICAL_KNOWLEDGE_BASE = [
  '常见症状初步判断',
  '药物使用基本指导',
  '就医建议和科室推荐',
  '日常健康保养建议',
  '医疗流程介绍',
];

export class MedicalAgent {
  private config: MedicalAgentConfig;

  constructor() {
    this.config = {
      systemPrompt: MEDICAL_SYSTEM_PROMPT,
      knowledgeBase: MEDICAL_KNOWLEDGE_BASE,
    };
  }

  async generateResponse(message: string) {
    const result = await streamText({
      model: aiConfig.openai(modelConfig.model),
      system: this.config.systemPrompt,
      prompt: message,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
    });

    return result;
  }

  getConfig(): MedicalAgentConfig {
    return this.config;
  }
}
