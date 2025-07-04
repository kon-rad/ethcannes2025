export interface AIModelInfo {
    organization: string;
    modelName: string;
    apiModelString: string;
    contextLength: number;
    quantization: 'FP8' | 'FP16' | 'INT4';
  }
  
  export const TOGETHER_AI_MODELS: { [key: string]: AIModelInfo } = {
    LLAMA_3_3_70B_INSTRUCT_TURBO: {
      organization: 'Meta',
      modelName: 'Llama 3.3 70B Instruct Turbo',
      apiModelString: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      contextLength: 131072,
      quantization: 'FP8'
    },
    LLAMA_3_1_8B_INSTRUCT_TURBO: {
      organization: 'Meta',
      modelName: 'Llama 3.1 8B Instruct Turbo',
      apiModelString: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      contextLength: 131072,
      quantization: 'FP8'
    },
    LLAMA_3_1_70B_INSTRUCT_TURBO: {
      organization: 'Meta',
      modelName: 'Llama 3.1 70B Instruct Turbo',
      apiModelString: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      contextLength: 131072,
      quantization: 'FP8'
    },
    LLAMA_3_1_405B_INSTRUCT_TURBO: {
      organization: 'Meta',
      modelName: 'Llama 3.1 405B Instruct Turbo',
      apiModelString: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      contextLength: 130815,
      quantization: 'FP8'
    },
    LLAMA_3_8B_INSTRUCT_TURBO: {
      organization: 'Meta',
      modelName: 'Llama 3 8B Instruct Turbo',
      apiModelString: 'meta-llama/Meta-Llama-3-8B-Instruct-Turbo',
      contextLength: 8192,
      quantization: 'FP8'
    },
    LLAMA_3_70B_INSTRUCT_TURBO: {
      organization: 'Meta',
      modelName: 'Llama 3 70B Instruct Turbo',
      apiModelString: 'meta-llama/Meta-Llama-3-70B-Instruct-Turbo',
      contextLength: 8192,
      quantization: 'FP8'
    },
    LLAMA_3_2_3B_INSTRUCT_TURBO: {
      organization: 'Meta',
      modelName: 'Llama 3.2 3B Instruct Turbo',
      apiModelString: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
      contextLength: 131072,
      quantization: 'FP16'
    },
    LLAMA_3_8B_INSTRUCT_LITE: {
      organization: 'Meta',
      modelName: 'Llama 3 8B Instruct Lite',
      apiModelString: 'meta-llama/Meta-Llama-3-8B-Instruct-Lite',
      contextLength: 8192,
      quantization: 'INT4'
    }
  } as const;
  
  // Default model for summarization
  export const DEFAULT_SUMMARIZATION_MODEL = TOGETHER_AI_MODELS.LLAMA_3_1_8B_INSTRUCT_TURBO;