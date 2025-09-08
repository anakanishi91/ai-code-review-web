import { modelLibURLPrefix, modelVersion } from '@mlc-ai/web-llm';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL || process.env.PLAYWRIGHT || process.env.CI_PLAYWRIGHT,
);

export const programmingLanguages = [
  {
    id: 'python',
    label: 'Python',
    description: 'Readable, versatile, popular in AI and data.',
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    description: 'Core web language for interactive apps.',
  },
] as const;

export type ProgrammingLanguageType = (typeof programmingLanguages)[number]['id'];

export const DEFAULT_PROGRAMMING_LANGUAGE_TYPE: ProgrammingLanguageType = 'python';

export const chatModels = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    description: 'Online',
    isOnline: true,
  },
  {
    id: 'TinySwallow-1.5B',
    name: 'TinySwallow',
    description: 'Offline',
    isOnline: false,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    name: 'Llama 3.2',
    description: 'Offline',
    isOnline: false,
  },
] as const;

export type ChatModelId = (typeof chatModels)[number]['id'];

export const DEFAULT_CHAT_MODEL_ID: ChatModelId = 'gpt-4o-mini';

export const webllmModels = [
  {
    model: 'https://huggingface.co/SakanaAI/TinySwallow-1.5B-Instruct-q4f32_1-MLC',
    model_id: 'TinySwallow-1.5B',
    model_lib:
      // https://github.com/mlc-ai/binary-mlc-llm-libs/tree/main/web-llm-models/v0_2_48
      modelLibURLPrefix + modelVersion + '/Qwen2-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm',
  },
] as const;

export const LOCAL_STORAGE_KEY_CHAT_MODEL_ID = 'chat-model-id';
export const LOCAL_STORAGE_KEY_PROGRAMMING_LANGUAGE_TYPE = 'programming-language-type';
