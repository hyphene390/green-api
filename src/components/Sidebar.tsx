import type { Chat, Credentials } from '../api/types';
import type { PollingStatus } from '../hooks/useNotificationPolling';
import NewChatForm from './NewChatForm';
import Avatar from './Avatar';
import { formatTime } from '../utils/time';

const STATUS_TEXT: Partial<Record<PollingStatus, string>> = {
  standby: 'Сообщения получает другая вкладка',
  error: 'Нет связи, переподключаемся…',
};

interface Props {
  credentials: Credentials;
  chats: Chat[];
  activeChatId: string | null;
  pollingStatus: PollingStatus;
  pollingError: string | null;
  onSelectChat: (chatId: string) => void;
  onAddChat: (chat: Chat) => void;
  onLogout: () => void;
}

export default function Sidebar({
  credentials,
  chats,
  activeChatId,
  pollingStatus,
  pollingError,
  onSelectChat,
  onAddChat,
  onLogout,
}: Props) {
  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div>
          <div className="sidebar__title">Чаты</div>
          <div className={`status status--${pollingStatus}`} title={pollingError ?? undefined}>
            {STATUS_TEXT[pollingStatus] ?? pollingError ?? `Инстанс ${credentials.idInstance}`}
          </div>
        </div>
        <button className="icon-button" type="button" onClick={onLogout} title="Выйти">
          ⎋
        </button>
      </header>

      <NewChatForm credentials={credentials} onCreate={onAddChat} />

      <ul className="chat-list">
        {chats.length === 0 && <li className="chat-list__empty">Чатов пока нет</li>}
        {chats.map((chat) => (
          <li key={chat.chatId}>
            <button
              type="button"
              className={`chat-item ${chat.chatId === activeChatId ? 'chat-item--active' : ''}`}
              onClick={() => onSelectChat(chat.chatId)}
            >
              <Avatar title={chat.title} />
              <span className="chat-item__body">
                <span className="chat-item__top">
                  <span className="chat-item__title">{chat.title}</span>
                  {chat.lastTimestamp && <span className="chat-item__time">{formatTime(chat.lastTimestamp)}</span>}
                </span>
                <span className="chat-item__bottom">
                  <span className="chat-item__preview">{chat.lastMessage ?? chat.subtitle ?? ''}</span>
                  {!!chat.unread && <span className="badge">{chat.unread}</span>}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
