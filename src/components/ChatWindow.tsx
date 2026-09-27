import type { Chat, Message } from '../api/types';
import Avatar from './Avatar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface Props {
  chat: Chat;
  messages: Message[];
  onSend: (text: string) => void;
  onRetry: (message: Message) => void;
  onBack: () => void;
}

export default function ChatWindow({ chat, messages, onSend, onRetry, onBack }: Props) {
  return (
    <main className="chat">
      <header className="chat__header">
        <button className="icon-button chat__back" type="button" onClick={onBack} aria-label="Назад к чатам">
          ←
        </button>
        <Avatar title={chat.title} />
        <div className="chat__meta">
          <div className="chat__title">{chat.title}</div>
          {chat.subtitle && chat.subtitle !== chat.title && <div className="chat__subtitle">{chat.subtitle}</div>}
        </div>
      </header>
      <MessageList messages={messages} onRetry={onRetry} />
      <MessageInput onSend={onSend} />
    </main>
  );
}
