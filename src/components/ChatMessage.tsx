import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLast,
}) => {
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLast && msgRef.current) {
      msgRef.current.scrollIntoView({
        behavior: 'instant',
        block: 'end',
        inline: 'end',
      });
    }
  }, [isLast]);

  return (
    <div
      className={`flex gap-4 p-6 ${
        message.role === 'assistant' ? 'bg-gray-50' : ''
      }`}
      ref={isLast ? msgRef : null}
    >
      <div className="flex-shrink-0">
        {message.role === 'assistant' ? (
          <Bot className="h-6 w-6 text-blue-500" />
        ) : (
          <User className="h-6 w-6 text-gray-600" />
        )}
      </div>
      <div className="flex-grow prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};
