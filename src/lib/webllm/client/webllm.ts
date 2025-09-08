'use client';

import { InitProgressReport, prebuiltAppConfig, WebWorkerMLCEngine } from '@mlc-ai/web-llm';

import { ChatModelId, webllmModels } from '@/lib/constants';

export class WebLLMApi {
  private modelId?: ChatModelId;
  private initialized = false;
  engine: WebWorkerMLCEngine;

  constructor() {
    this.engine = new WebWorkerMLCEngine(
      new Worker(new URL('../worker/web-worker.ts', import.meta.url), {
        type: 'module',
      }),
      {
        appConfig: {
          ...prebuiltAppConfig,
          model_list: [...prebuiltAppConfig.model_list, ...webllmModels],
        },
      },
    );
  }

  async chat(
    prompt: string,
    modelId: ChatModelId,
    onUpdate: (message: string) => void,
  ): Promise<string> {
    if (!this.initialized || this.modelId !== modelId) {
      try {
        this.engine.setInitProgressCallback((report: InitProgressReport) => {
          onUpdate(report.text);
        });
        await this.engine.reload(modelId);
        this.initialized = true;
        this.modelId = modelId;
      } catch (err) {
        let errorMessage = '';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        throw new Error(`Failed to initialize model: ${errorMessage}`);
      }
    }

    try {
      const completion = await this.engine.chatCompletion({
        stream: true,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
      let content: string = '';
      for await (const chunk of completion) {
        if (chunk.choices[0]?.delta.content) {
          content += chunk.choices[0].delta.content;
          onUpdate(content);
        }
      }
      return content;
    } catch (err) {
      let errorMessage = '';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      throw new Error(`Failed to generate response: ${errorMessage}`);
    }
  }
}
