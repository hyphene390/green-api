import { useEffect, useRef } from 'react';
import type { Message } from '../api/types';
import { formatClock } from '../utils/time';

const STATUS_ICON: Record<NonNullable<Message['status']>, string> = {
  sending: '🕓',
  sent: '✓',
  error: '!',
};

interface Props {
  messages: Message[];
  onRetry: (message: Message) => void;
}

export default function MessageList({ messages, onRetry }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  return (
    <div className="messages">
      {messages.length === 0 && <p className="messages__empty">Сообщений пока нет</p>}
      {messages.map((message) => (
        <div key={message.id} className={`message message--${message.direction}`}>
          <p className="message__text">{message.text}</p>
          <span className="message__meta">
            {formatClock(message.timestamp)}
            {message.status && (
              <span className={`message__status message__status--${message.status}`}>{STATUS_ICON[message.status]}</span>
            )}
          </span>
          {message.status === 'error' && (
            <button className="message__retry" type="button" onClick={() => onRetry(message)}>
              Не отправлено. Повторить
            </button>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
