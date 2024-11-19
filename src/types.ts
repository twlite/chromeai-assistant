export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  streamingContent: string | null;
}

export interface AISession {
  promptStreaming: (input: string) => AsyncIterableIterator<string>;
}

declare global {
  interface Window {
    ai: {
      languageModel: {
        create: (config: { systemPrompt: string }) => Promise<AISession>;
      };
    };
  }
}
