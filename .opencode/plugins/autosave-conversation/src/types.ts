export interface SessionInfo {
  id: string;
  parentID?: string;
  title: string;
  filePath: string;
  createdAt: Date;
  childSessionIDs: string[];
}

export interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  parts: PartData[];
  createdAt: number;
}

export type PartData = TextPartData | ToolPartData | FilePartData | ReasoningPartData | OtherPartData;

export interface TextPartData {
  type: 'text';
  text: string;
}

export interface ToolPartData {
  type: 'tool';
  tool: string;
  state: {
    status: string;
    input?: Record<string, unknown>;
    output?: string;
    title?: string;
    error?: string;
  };
}

export interface FilePartData {
  type: 'file';
  filename?: string;
  url: string;
  mime: string;
  localPath?: string;
}

export interface ReasoningPartData {
  type: 'reasoning';
  text: string;
}

export interface OtherPartData {
  type: string;
  [key: string]: unknown;
}

export interface ChildSessionData {
  title: string;
  createdAt: Date;
  messages: MessageData[];
}

export interface PluginConfig {
  saveDirectory: string;
  maxTopicLength: number;
  debounceMs: number;
}

export const DEFAULT_CONFIG: PluginConfig = {
  saveDirectory: './conversations',
  maxTopicLength: 30,
  debounceMs: 2000,
};