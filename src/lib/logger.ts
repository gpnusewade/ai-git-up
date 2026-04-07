'use strict';

import { NextRequest } from 'next/server';

export interface ClientFingerprint {
  simplified: { ip: string; userAgent: string };
  basic: { ip: string; userAgent: string; acceptLanguage: string };
  complete: { ip: string; userAgent: string; acceptLanguage: string; referer: string; forwarded: string; connection: string };
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatDate(): string {
  return new Date().toISOString();
}

export function extractFingerprint(req: NextRequest): ClientFingerprint {
  const getHeader = (name: string): string => req.headers.get(name) || '';
  
  const ip = 
    getHeader('x-forwarded-for').split(',')[0]?.trim() ||
    getHeader('x-real-ip') ||
    'unknown';
  
  const userAgent = getHeader('user-agent') || 'unknown';
  const acceptLanguage = getHeader('accept-language') || '';
  const referer = getHeader('referer') || '';
  const forwarded = getHeader('forwarded') || '';
  
  return {
    simplified: { ip, userAgent },
    basic: { ip, userAgent, acceptLanguage },
    complete: { ip, userAgent, acceptLanguage, referer, forwarded, connection: forwarded }
  };
}

export function log(type: string, data: Record<string, unknown>, level: LogLevel = 'info'): void {
  const entry = {
    level,
    timestamp: formatDate(),
    service: 'anythingforai',
    event: type,
    ...data
  };
  
  const logOutput = JSON.stringify(entry);
  
  switch (level) {
    case 'error':
      console.error(logOutput);
      break;
    case 'warn':
      console.warn(logOutput);
      break;
    case 'debug':
      console.debug(logOutput);
      break;
    default:
      console.log(logOutput);
  }
}

export function logError(type: string, error: unknown, context?: Record<string, unknown>): void {
  const errorData = {
    error: {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined,
    },
    ...context,
  };
  
  log(type, errorData, 'error');
}
