import { WebWorkerMLCEngine } from '@mlc-ai/web-llm';

import { ChatModelId } from '@/lib/constants';
import { WebLLMApi } from '@/lib/webllm/client/webllm';

jest.mock('@mlc-ai/web-llm', () => {
  const original = jest.requireActual('@mlc-ai/web-llm');
  return {
    ...original,
    WebWorkerMLCEngine: jest.fn().mockImplementation(() => ({
      setInitProgressCallback: jest.fn(),
      reload: jest.fn(),
      chatCompletion: jest.fn(),
    })),
  };
});

global.Worker = class {
  constructor(_stringUrl: string, _options?: WorkerOptions) {}
} as typeof globalThis.Worker;

describe('WebLLMApi', () => {
  let api: WebLLMApi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEngine: any;

  beforeEach(() => {
    api = new WebLLMApi();
    mockEngine = (WebWorkerMLCEngine as jest.Mock).mock.results[0].value;
  });

  it('should initialize engine and stream chat', async () => {
    const onUpdate = jest.fn();

    mockEngine.reload.mockResolvedValueOnce(undefined);
    mockEngine.chatCompletion.mockImplementationOnce(async function* () {
      yield { choices: [{ delta: { content: 'Hello' } }] };
      yield { choices: [{ delta: { content: ' World' } }] };
    });

    const result = await api.chat('Hi', 'gpt-test' as ChatModelId, onUpdate);

    expect(mockEngine.setInitProgressCallback).toHaveBeenCalled();
    expect(mockEngine.reload).toHaveBeenCalledWith('gpt-test');
    expect(mockEngine.chatCompletion).toHaveBeenCalled();
    expect(result).toBe('Hello World');
    expect(onUpdate).toHaveBeenCalledWith('Hello');
    expect(onUpdate).toHaveBeenCalledWith('Hello World');
  });

  it('should not reload engine if same model is used again', async () => {
    const onUpdate = jest.fn();

    mockEngine.reload.mockResolvedValueOnce(undefined);
    mockEngine.chatCompletion.mockImplementation(async function* () {
      yield { choices: [{ delta: { content: 'Test' } }] };
    });

    await api.chat('Hi', 'gpt-test' as ChatModelId, onUpdate);
    onUpdate.mockClear();

    const result = await api.chat('Hi again', 'gpt-test' as ChatModelId, onUpdate);

    expect(mockEngine.reload).toHaveBeenCalledTimes(1);
    expect(result).toBe('Test');
  });

  it('should throw error if reload fails', async () => {
    mockEngine.reload.mockRejectedValueOnce(new Error('Reload failed'));
    const onUpdate = jest.fn();

    await expect(api.chat('Hi', 'gpt-test' as ChatModelId, onUpdate)).rejects.toThrow(
      'Failed to initialize model: Reload failed',
    );
  });

  it('should throw error if chatCompletion fails', async () => {
    mockEngine.reload.mockResolvedValueOnce(undefined);
    mockEngine.chatCompletion.mockRejectedValueOnce(new Error('Chat failed'));
    const onUpdate = jest.fn();

    await expect(api.chat('Hi', 'gpt-test' as ChatModelId, onUpdate)).rejects.toThrow(
      'Failed to generate response: Chat failed',
    );
  });

  it('should call onUpdate with init progress', async () => {
    const onUpdate = jest.fn();

    mockEngine.reload.mockResolvedValueOnce(undefined);
    mockEngine.setInitProgressCallback.mockImplementation(
      (callback: (progress: { text: string }) => void) => {
        callback({ text: 'Initializing...' });
      },
    );
    mockEngine.chatCompletion.mockImplementation(async function* () {});

    await api.chat('Hi', 'gpt-test' as ChatModelId, onUpdate);

    expect(onUpdate).toHaveBeenCalledWith('Initializing...');
  });
});
