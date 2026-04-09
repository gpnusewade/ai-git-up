export interface MedicalAgentConfig {
  systemPrompt: string;
  knowledgeBase: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  message: string;
  context?: string[];
  requiresHuman?: boolean;
}
