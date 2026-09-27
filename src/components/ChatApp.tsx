import { useCallback, useEffect, useRef, useState } from 'react';
import { sendMessage } from '../api/greenApi';
import type { Chat, Credentials, Message, NotificationBody } from '../api/types';
import { useStoredState } from '../hooks/useStoredState';
import { useNotificationPolling } from '../hooks/useNotificationPolling';
import { extractIncomingText } from '../utils/notifications';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

type MessagesByChat = Record<string, Message[]>;

// Хранилище переписывается целиком на каждое сообщение, поэтому история ограничена
const MAX_MESSAGES_PER_CHAT = 200;

export function storageKeys(idInstance: string) {
  return {
    chats: `greenApi.${idInstance}.chats`,
    messages: `greenApi.${idInstance}.messages`,
  };
}

interface Props {
  credentials: Credentials;
  onLogout: () => void;
  onAuthError: (message: string) => void;
}

export default function ChatApp({ credentials, onLogout, onAuthError }: Props) {
  const keys = storageKeys(credentials.idInstance);
  const [chats, setChats] = useStoredState<Chat[]>(keys.chats, []);
  const [messages, setMessages] = useStoredState<MessagesByChat>(keys.messages, {});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Нужен обработчику уведомлений, чтобы отсеять повтор уже полученного сообщения.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const appendMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => {
        const list = prev[message.chatId] ?? [];
        if (list.some((m) => m.id === message.id)) return prev;
        return { ...prev, [message.chatId]: [...list, message].slice(-MAX_MESSAGES_PER_CHAT) };
      });
    },
    [setMessages],
  );

  const patchMessage = useCallback(
    (chatId: string, id: string, patch: Partial<Message>) => {
      setMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
    },
    [setMessages],
  );

  const touchChat = useCallback(
    (chatId: string, text: string, timestamp: number, opts: { incoming: boolean; title?: string }) => {
      setChats((prev) => {
        const existing = prev.find((c) => c.chatId === chatId);
        const base: Chat = existing ?? { chatId, title: opts.title || chatId };
        const unread = opts.incoming && chatId !== activeChatId ? (base.unread ?? 0) + 1 : base.unread;
        const updated: Chat = { ...base, lastMessage: text, lastTimestamp: timestamp, unread };
        return [updated, ...prev.filter((c) => c.chatId !== chatId)];
      });
    },
    [setChats, activeChatId],
  );

  const handleNotification = useCallback(
    (body: NotificationBody) => {
      const incoming = extractIncomingText(body);
      if (!incoming) return;
      if (messagesRef.current[incoming.chatId]?.some((m) => m.id === incoming.idMessage)) return;

      appendMessage({
        id: incoming.idMessage,
        chatId: incoming.chatId,
        text: incoming.text,
        direction: 'in',
        timestamp: incoming.timestamp,
      });
      touchChat(incoming.chatId, incoming.text, incoming.timestamp, { incoming: true, title: incoming.senderName });
    },
    [appendMessage, touchChat],
  );

  const { status, lastError } = useNotificationPolling(credentials, handleNotification, onAuthError);

  const handleSend = async (chatId: string, text: string) => {
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = Date.now();
    appendMessage({ id: tempId, chatId, text, direction: 'out', timestamp, status: 'sending' });
    touchChat(chatId, text, timestamp, { incoming: false });

    try {
      const { idMessage } = await sendMessage(credentials, chatId, text);
      patchMessage(chatId, tempId, { id: idMessage, status: 'sent' });
    } catch {
      patchMessage(chatId, tempId, { status: 'error' });
    }
  };

  const handleRetry = (message: Message) => {
    setMessages((prev) => ({
      ...prev,
      [message.chatId]: (prev[message.chatId] ?? []).filter((m) => m.id !== message.id),
    }));
    void handleSend(message.chatId, message.text);
  };

  const handleAddChat = (chat: Chat) => {
    setChats((prev) => (prev.some((c) => c.chatId === chat.chatId) ? prev : [chat, ...prev]));
    setActiveChatId(chat.chatId);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setChats((prev) => prev.map((c) => (c.chatId === chatId && c.unread ? { ...c, unread: 0 } : c)));
  };

  const activeChat = chats.find((c) => c.chatId === activeChatId) ?? null;

  return (
    <div className={`app ${activeChat ? 'app--chat-open' : ''}`}>
      <Sidebar
        credentials={credentials}
        chats={chats}
        activeChatId={activeChatId}
        pollingStatus={status}
        pollingError={lastError}
        onSelectChat={handleSelectChat}
        onAddChat={handleAddChat}
        onLogout={onLogout}
      />
      {activeChat ? (
        <ChatWindow
          key={activeChat.chatId}
          chat={activeChat}
          messages={messages[activeChat.chatId] ?? []}
          onSend={(text) => handleSend(activeChat.chatId, text)}
          onRetry={handleRetry}
          onBack={() => setActiveChatId(null)}
        />
      ) : (
        <main className="chat chat--empty">
          <p>Выберите чат или создайте новый по номеру телефона</p>
        </main>
      )}
    </div>
  );
}
