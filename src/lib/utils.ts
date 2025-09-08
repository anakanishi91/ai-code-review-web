import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import z from 'zod';

import {
  ChatModelId,
  chatModels,
  programmingLanguages,
  ProgrammingLanguageType,
} from './constants';
import { ApiError } from './errors';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async <T>(url: string): Promise<T> => {
  let response;
  try {
    response = await fetch(url);
  } catch {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError('NETWORK_ERROR');
    }
    throw new ApiError('UNKNOWN_ERROR');
  }

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError('UNKNOWN_ERROR');
  }
};

export async function fetchWithInit(input: RequestInfo | URL, init: RequestInit) {
  let response;
  try {
    response = await fetch(input, init);
  } catch {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError('NETWORK_ERROR');
    }
    throw new ApiError('UNKNOWN_ERROR');
  }

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError('UNKNOWN_ERROR');
  }
}

export async function fetchWithSchema<T extends z.ZodTypeAny>(
  url: string,
  options: RequestInit,
  schema: T,
): Promise<z.infer<T>> {
  const data = await fetchWithInit(url, options);

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError('VALIDATION_ERROR');
  }
  return parsed.data;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isChatModelId(input: string | null): input is ChatModelId {
  return chatModels.some((e) => e.id === input);
}

export function isProgrammingLanguageType(input: string | null): input is ProgrammingLanguageType {
  return programmingLanguages.some((e) => e.id === input);
}

export async function streamPlainText(res: Response, onChunk: (text: string) => void) {
  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  if (!res.body) {
    throw new ApiError('UNKNOWN_ERROR');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  } catch (err) {
    throw err;
  } finally {
    reader.releaseLock();
  }
}
