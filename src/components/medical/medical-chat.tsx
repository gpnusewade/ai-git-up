'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { ToolResultCard } from './tool-result-card';
import { EmergencyBanner } from './emergency-banner';
import { encrypt } from '@/lib/crypto/rsa';
import type { Doctor, InsurancePlan, ContactInfo } from '@/types/medical-agent';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolResult?: {
    type: 'doctor' | 'insurance' | 'contact';
    data: Doctor[] | InsurancePlan[] | ContactInfo[];
  };
  quickActions?: string[];
}

interface ToolCall {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
}

interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: {
    doctors?: Doctor[];
    plans?: InsurancePlan[];
    contacts?: ContactInfo[];
  };
}

export default function MedicalChat() {
  const { t, locale } = useI18n();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showEmergency, setShowEmergency] = useState(false);
  const [pendingToolCalls, setPendingToolCalls] = useState<ToolCall[]>([]);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [useDemo, setUseDemo] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch('/api/chat/medical/public-key')
      .then((res) => res.json())
      .then((data) => setPublicKey(data.publicKey))
      .catch(() => console.error('Failed to fetch public key'));
  }, []);

  useEffect(() => {
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      content: t('medical.greeting'),
      timestamp: Date.now(),
      quickActions: ['findDoctor', 'appointDoctor', 'prescriptionDelivery'],
    }]);
  }, [t]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const parseToolCallFromStream = useCallback((chunk: unknown): ToolCall | null => {
    if (chunk && typeof chunk === 'object' && 'type' in chunk) {
      const typed = chunk as Record<string, unknown>;
      if (typed.type === 'tool-input-available') {
        return {
          toolCallId: typed.toolCallId as string,
          toolName: typed.toolName as string,
          input: (typed.input || typed.output || {}) as Record<string, unknown>,
        };
      }
    }
    return null;
  }, []);

  const parseToolResultFromStream = useCallback((chunk: unknown): ToolResult | null => {
    if (chunk && typeof chunk === 'object' && 'type' in chunk) {
      const typed = chunk as Record<string, unknown>;
      if (typed.type === 'tool-output-available') {
        const resultData = (typed.result || typed.output || {}) as ToolResult['result'];
        return {
          toolCallId: typed.toolCallId as string,
          toolName: typed.toolName as string,
          result: resultData,
        };
      }
    }
    return null;
  }, []);

  const getToolResultType = useCallback((toolName: string, result: ToolResult['result']): 'doctor' | 'insurance' | 'contact' | null => {
    if (toolName === 'recommend_doctors' && result.doctors) return 'doctor';
    if (toolName === 'suggest_insurance' && result.plans) return 'insurance';
    if (toolName === 'get_contact_info' && result.contacts) return 'contact';
    return null;
  }, []);

  const getToolResultData = useCallback((toolName: string, result: ToolResult['result']): Doctor[] | InsurancePlan[] | ContactInfo[] | null => {
    if (toolName === 'recommend_doctors') return result.doctors || null;
    if (toolName === 'suggest_insurance') return result.plans || null;
    if (toolName === 'get_contact_info') return result.contacts || null;
    return null;
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    setPendingToolCalls([]);

    const abortController = new AbortController();
    abortRef.current = abortController;

    const allMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const mockToken = 'mock-user-token-12345';
    let encryptedToken = '';
    if (publicKey && !useDemo) {
      encryptedToken = await encrypt(publicKey, mockToken);
    }

    try {
      const apiUrl = useDemo ? '/api/chat/demo' : '/api/chat/medical';
      const requestBody = useDemo
        ? { messages: allMessages, locale }
        : { messages: allMessages, locale, encryptedToken };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      const currentToolCalls: ToolCall[] = [];
      const currentToolResults: ToolResult[] = [];

      const commitTextContent = () => {
        if (fullContent.trim()) {
          const textMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, textMessage]);
          fullContent = '';
          setStreamingContent('');
        }
      };

      const commitToolResult = (toolResult: ToolResult) => {
        let resolvedToolName: string | undefined = toolResult.toolName;
        if (!resolvedToolName) {
          const matchedCall = currentToolCalls.find(
            (call) => call.toolCallId === toolResult.toolCallId
          );
          resolvedToolName = matchedCall?.toolName;
        }

        if (!resolvedToolName) return;

        const resultType = getToolResultType(resolvedToolName, toolResult.result);
        const resultData = getToolResultData(resolvedToolName, toolResult.result);

        if (resultType && resultData) {
          const toolMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            toolResult: {
              type: resultType,
              data: resultData,
            },
          };
          setMessages((prev) => [...prev, toolMessage]);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const chunk = JSON.parse(trimmed.slice(6));

              const toolCall = parseToolCallFromStream(chunk);
              if (toolCall) {
                currentToolCalls.push(toolCall);
                setPendingToolCalls((prev) => [...prev, toolCall]);
                continue;
              }

              const toolResult = parseToolResultFromStream(chunk);
              if (toolResult) {
                currentToolResults.push(toolResult);

                commitTextContent();
                console.log(toolResult)
                commitToolResult(toolResult);
                continue;
              }

              if (chunk.type === 'text-delta' && chunk.delta) {
                fullContent += chunk.delta;
                setStreamingContent(fullContent);
              } else if (chunk.type === 'error' && chunk.error) {
                throw new Error(chunk.error);
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && !(parseErr instanceof SyntaxError)) {
                throw parseErr;
              }
            }
          }
        }
      }

      if (fullContent.trim()) {
        commitTextContent();
      }

      if (currentToolCalls.length > 0 && currentToolResults.length === 0) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: t('medical.tool.processing'),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      const hasEmergency = messages.some((m) => m.content.includes('120') || m.content.includes('急救'));
      if (hasEmergency) {
        setShowEmergency(true);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: err as string,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      abortRef.current = null;
    }
  }, [input, isLoading, messages, t, locale, publicKey, parseToolCallFromStream, parseToolResultFromStream, getToolResultType, getToolResultData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleQuickAction = useCallback((action: string) => {
    const actionMessages: Record<string, string> = {
      findDoctor: t('medical.quickActions.findDoctor'),
      appointDoctor: t('medical.quickActions.appointDoctor'),
      prescriptionDelivery: t('medical.quickActions.prescriptionDelivery'),
    };
    const text = actionMessages[action] || action;
    setInput(text);
    setTimeout(() => {
      const sendEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      textareaRef.current?.dispatchEvent(sendEvent);
    }, 50);
  }, [t]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[#e5ddd5]">
      {showEmergency && (
        <EmergencyBanner onDismiss={() => setShowEmergency(false)} />
      )}

      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">医疗客服</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${!useDemo ? 'text-[#6366f1] font-medium' : 'text-gray-400'}`}>真实接口</span>
          <button
            onClick={() => setUseDemo(!useDemo)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${useDemo ? 'bg-[#6366f1]' : 'bg-gray-300'}`}
            aria-label="Toggle demo mode"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${useDemo ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
          <span className={`text-xs ${useDemo ? 'text-[#6366f1] font-medium' : 'text-gray-400'}`}>Demo</span>
        </div>
      </div>

      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 relative">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white/80 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="text-lg font-medium mb-1 text-gray-800">
              {t('medical.welcome')}
            </div>
            <div className="text-sm text-gray-500">
              {t('medical.welcomeHint')}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''} space-y-2`}>
              {msg.content && (
                <div
                  className={`px-3 py-2 rounded-2xl ${msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                    }`}
                >
                  <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                    {msg.content}

                    {msg.quickActions && msg.quickActions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.quickActions.map((action) => (
                          <button
                            key={action}
                            onClick={() => handleQuickAction(action)}
                            className="px-3 py-2 rounded-xl text-sm font-medium transition-all border bg-white border-gray-200 text-gray-600 hover:bg-[#6366f1] hover:text-white hover:border-[#6366f1]"
                          >
                            {t(`medical.quickActions.${action}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {msg.toolResult && (
                <ToolResultCard
                  type={msg.toolResult.type}
                  data={msg.toolResult.data}
                />
              )}

              <div className={`text-[11px] px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'
                } text-gray-400`}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] space-y-2">
              <div
                className="px-3 py-2 rounded-2xl rounded-bl-md bg-white text-gray-800 shadow-sm"
              >
                <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {streamingContent}
                  <span className="inline-block w-0.5 h-4 bg-[#6366f1] ml-0.5 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && pendingToolCalls.length === 0 && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {pendingToolCalls.length > 0 && (
          <div className="flex justify-start">
            
            <div className="px-4 py-2 rounded-2xl rounded-bl-md bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-[#6366f1]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-gray-500">
                  {t('medical.tool.searching')}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-3 py-2 bg-[#f0f0f0] border-t border-gray-200">
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-2xl flex items-end bg-white">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('medical.inputPlaceholder')}
              rows={1}
              className="flex-1 px-4 py-2.5 bg-transparent resize-none focus:outline-none text-[15px] max-h-[120px] text-gray-800 placeholder-gray-400"
              disabled={isLoading}
            />
          </div>
          {isLoading ? (
            <button
              onClick={handleAbort}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
              aria-label={t('medical.stop')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${input.trim()
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-[#6366f1]/30'
                  : 'bg-gray-200 text-gray-400'
                }`}
              aria-label={t('medical.send')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
