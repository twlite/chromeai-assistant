import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Message, ChatState, AISession } from './types';
import { Loader2 } from 'lucide-react';

const systemPrompt = `<system>
You are an expert software engineer who is an AI and technical advisor with deep knowledge across multiple domains. Your responses should be:

1. Technical and precise, using industry-standard terminology
2. Practical and implementation-focused
3. Security-conscious, highlighting potential risks
4. Performance-oriented, considering scalability
5. Modern and up-to-date with current best practices
6. Well-structured with clear code examples when relevant
7. Focused on maintainable, clean code principles

When providing code examples:
- Include comprehensive error handling
- Add brief comments for complex logic
- Follow language-specific conventions
- Consider edge cases
- Prioritize type safety
- Implement proper error boundaries

Always consider:
- Security implications
- Performance optimization
- Cross-browser compatibility
- Accessibility standards
- Testing strategies
- CI/CD best practices
</system>`;

function App() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    streamingContent: null,
  });
  const sessionRef = useRef<AISession | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        sessionRef.current = await window.ai.languageModel.create({
          systemPrompt,
        });
      } catch (error) {
        console.error(error);
        setState((prev) => ({
          ...prev,
          error: `Failed to initialize AI session: ${String(
            error
          )}. Make sure you are on google chrome canary.`,
        }));
      }
    };
    initSession();
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      if (!sessionRef.current) return;

      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        isLoading: true,
        error: null,
        streamingContent: null,
      }));

      try {
        const stream = sessionRef.current.promptStreaming(
          `<previousMessages>${state.messages.slice(-1, -10).map((m) => {
            return `<message role="${m.role}">${m.content}</message>`;
          })}</previousMessages>\n<message role="user">${content}</message>`
        );

        for await (const chunk of stream) {
          setState((prev) => ({
            ...prev,
            streamingContent: chunk,
          }));
        }

        // After streaming is complete, add the final assistant message
        setState((prev) => ({
          ...prev,
          streamingContent: null,
          messages: [
            ...prev.messages,
            {
              id: 'response-' + newMessage.id,
              role: 'assistant',
              content: prev.streamingContent || '',
            },
          ],
          isLoading: false,
        }));
      } catch (error) {
        console.error(error);
        setState((prev) => ({
          ...prev,
          error: `Failed to get response from AI: ${String(error)}`,
          isLoading: false,
        }));
      }
    },
    [sessionRef, state.messages]
  );

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="border-b p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">ChromeAI</h1>
        </div>
      </header>

      <main className="flex-grow overflow-auto">
        <div className="max-w-4xl mx-auto divide-y">
          {state.messages.map((message, idx, arr) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={
                state.streamingContent && state.isLoading
                  ? false
                  : idx === arr.length - 1
              }
            />
          ))}
          {state.streamingContent && state.isLoading ? (
            <ChatMessage
              message={{
                id: 'streaming',
                role: 'assistant',
                content: state.streamingContent,
              }}
              isLast={true}
            />
          ) : null}
          {state.isLoading && !state.streamingContent && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}
          {state.error && (
            <div className="p-4 text-red-500 text-center">{state.error}</div>
          )}
        </div>
      </main>

      <ChatInput onSend={handleSend} disabled={state.isLoading} />
    </div>
  );
}

export default App;
