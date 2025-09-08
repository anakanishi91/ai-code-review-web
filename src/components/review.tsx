'use client';

import { EditorView } from 'codemirror';
import { useEffect, useRef, useState } from 'react';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';

import { ReviewHeader } from '@/components/review-header';
import {
  ChatModelId,
  chatModels,
  DEFAULT_CHAT_MODEL_ID,
  DEFAULT_PROGRAMMING_LANGUAGE_TYPE,
  LOCAL_STORAGE_KEY_CHAT_MODEL_ID,
  LOCAL_STORAGE_KEY_PROGRAMMING_LANGUAGE_TYPE,
  ProgrammingLanguageType,
} from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import { generateCodeReviewPrompt } from '@/lib/prompts';
import {
  generateUUID,
  isChatModelId,
  isProgrammingLanguageType,
  streamPlainText,
} from '@/lib/utils';
import { WebLLMApi } from '@/lib/webllm/client/webllm';

import { CodeReview } from './code-review';
import { getReviewHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';

export function Review({
  initialCode,
  initialReview,
  initialChatModelId,
  initialLanguageType,
}: {
  initialCode: string;
  initialReview: string | null;
  initialChatModelId: ChatModelId | null;
  initialLanguageType: ProgrammingLanguageType | null;
}) {
  const { mutate } = useSWRConfig();
  const editorRef = useRef<EditorView | null>(null);
  const [review, setReview] = useState<string | null>(initialReview);
  const [isReady, setIsReady] = useState(true);
  const [webllm, setWebLLM] = useState<WebLLMApi | undefined>(undefined);
  const [modelId, setModelId] = useState<ChatModelId>(DEFAULT_CHAT_MODEL_ID);
  const [languageType, setLanguageType] = useState<ProgrammingLanguageType>(
    DEFAULT_PROGRAMMING_LANGUAGE_TYPE,
  );

  useEffect(() => {
    if (!webllm) {
      setWebLLM(new WebLLMApi());
    }

    if (initialChatModelId) {
      setModelId(initialChatModelId);
    } else {
      const value = localStorage.getItem(LOCAL_STORAGE_KEY_CHAT_MODEL_ID);
      if (isChatModelId(value)) {
        setModelId(value);
      }
    }

    if (initialLanguageType) {
      setLanguageType(initialLanguageType);
    } else {
      const value = localStorage.getItem(LOCAL_STORAGE_KEY_PROGRAMMING_LANGUAGE_TYPE);
      if (isProgrammingLanguageType(value)) {
        setLanguageType(value);
      }
    }
    // NOTE: we only want to run this effect once
    // eslint-disable-next-line
  }, []);

  const sendCode = useCallback(async () => {
    const code = editorRef.current?.state.doc.toString() || '';
    const id = generateUUID();
    window.history.replaceState({}, '', `/review/${id}`);
    setReview('');
    setIsReady(false);

    try {
      const chatModel = chatModels.find((model) => model.id === modelId);
      if (!chatModel) throw new Error('Failed to find chat model');

      if (chatModel.isOnline) {
        const res = await fetch('/api/review/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            code,
            modelId,
            languageType,
          }),
          cache: 'no-store',
        });

        await streamPlainText(res, (chunk) => setReview((prev) => prev + chunk));
      } else {
        if (!webllm) throw new Error('Failed to initialize webllm');

        const res = await webllm.chat(
          generateCodeReviewPrompt(code, languageType),
          modelId,
          (message) => setReview(message),
        );

        await fetch('/api/review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            code,
            modelId,
            languageType,
            review: res,
          }),
          cache: 'no-store',
        });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          type: 'error',
          description: error.detailedMessage,
        });
      }
      if (error instanceof Error) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    } finally {
      setIsReady(true);
      mutate(unstable_serialize(getReviewHistoryPaginationKey));
    }
  }, [modelId, languageType, editorRef, webllm, mutate, setReview]);

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ReviewHeader
        modelId={modelId}
        setModelId={setModelId}
        languageType={languageType}
        setLanguageType={setLanguageType}
        sendCode={sendCode}
        isReady={isReady}
      />
      <CodeReview
        editorRef={editorRef}
        initialCode={initialCode}
        languageType={languageType}
        review={review}
      />
    </div>
  );
}
