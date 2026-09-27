import { useState, type FormEvent } from 'react';
import { checkAccount } from '../api/greenApi';
import type { Chat, Credentials } from '../api/types';
import { formatPhone, normalizePhone, normalizeUsername } from '../utils/phone';

interface Props {
  credentials: Credentials;
  onCreate: (chat: Chat) => void;
}

export default function NewChatForm({ credentials, onCreate }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const input = value.trim();
    const isUsername = input.startsWith('@');
    const phone = isUsername ? null : normalizePhone(input);
    const username = isUsername ? normalizeUsername(input) : null;

    if (!phone && !username) {
      setError(isUsername ? 'Некорректный username' : 'Введите номер с кодом страны, например +7 999 123-45-67');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await checkAccount(credentials, phone ? { phoneNumber: phone } : { username: username! });
      if (!result.exist || !result.chatId) {
        setError('Аккаунт Telegram не найден');
        return;
      }
      const subtitle = phone ? formatPhone(phone) : username!;
      onCreate({ chatId: result.chatId, title: result.username || subtitle, subtitle });
      setValue('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось проверить аккаунт');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="new-chat" onSubmit={handleSubmit}>
      <div className="new-chat__row">
        <input
          className="new-chat__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Номер телефона или @username"
          aria-label="Номер телефона или username собеседника"
        />
        <button className="button button--small" type="submit" disabled={loading || !value.trim()}>
          {loading ? '…' : 'Создать'}
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
