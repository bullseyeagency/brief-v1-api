/**
 * Debug wrapper for fetch that logs API calls to the console
 */

import { addLog } from '@/components/DebugConsole';

function redactSensitiveData(data: any): any {
  if (!data) return data;

  const redacted = JSON.parse(JSON.stringify(data));

  // Redact API keys
  if (redacted.apiKey) {
    redacted.apiKey = redacted.apiKey.substring(0, 8) + '...[REDACTED]';
  }

  return redacted;
}

export async function debugFetch(url: string, options?: RequestInit): Promise<Response> {
  const startTime = Date.now();
  const method = options?.method || 'GET';

  // Parse and redact sensitive data
  let bodyData;
  if (options?.body) {
    try {
      bodyData = redactSensitiveData(JSON.parse(options.body as string));
    } catch {
      bodyData = '[Could not parse body]';
    }
  }

  // Log request
  addLog('request', `${method} ${url}`, {
    headers: options?.headers,
    body: bodyData,
  });

  try {
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    // Clone response to read body without consuming it
    const clonedResponse = response.clone();
    let responseData;

    try {
      responseData = await clonedResponse.json();
    } catch {
      responseData = await clonedResponse.text();
    }

    // Log response
    if (response.ok) {
      addLog('response', `${method} ${url} - ${response.status}`, responseData, duration);
    } else {
      addLog('error', `${method} ${url} - ${response.status}`, responseData, duration);
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    addLog('error', `${method} ${url} - Failed`, {
      error: error instanceof Error ? error.message : String(error),
    }, duration);
    throw error;
  }
}

export function logInfo(message: string, data?: any) {
  addLog('info', message, data);
}
