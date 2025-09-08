import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';
import log from 'loglevel';

let handler: WebWorkerMLCEngineHandler;

self.addEventListener('message', () => {});

self.onmessage = (msg: MessageEvent) => {
  if (!handler) {
    handler = new WebWorkerMLCEngineHandler();
    log.info('Web Worker: Web-LLM Engine Activated');
  }
  handler.onmessage(msg);
};
