import { useState, type FormEvent } from 'react';
import { getStateInstance } from '../api/greenApi';
import type { Credentials } from '../api/types';

function parseApiUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    return url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}

const STATE_MESSAGES: Record<string, string> = {
  notAuthorized: 'Инстанс не авторизован — войдите в Telegram в личном кабинете GREEN-API',
  blocked: 'Инстанс заблокирован',
  starting: 'Инстанс запускается, попробуйте через минуту',
  yellowCard: 'Отправка сообщений временно ограничена',
};

interface Props {
  initialError?: string | null;
  onLogin: (credentials: Credentials) => void;
}

export default function LoginForm({ initialError = null, onLogin }: Props) {
  const [apiUrl, setApiUrl] = useState('');
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsedUrl = parseApiUrl(apiUrl);
    if (!parsedUrl) {
      setError('apiUrl должен начинаться с https://');
      return;
    }
    if (!/^\d+$/.test(idInstance.trim())) {
      setError('idInstance должен состоять из цифр');
      return;
    }
    const credentials: Credentials = {
      apiUrl: parsedUrl,
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    };

    setLoading(true);
    setError(null);
    try {
      const { stateInstance } = await getStateInstance(credentials);
      if (stateInstance === 'authorized') onLogin(credentials);
      else setError(STATE_MESSAGES[stateInstance] ?? `Состояние инстанса: ${stateInstance}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось подключиться к GREEN-API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__logo" aria-hidden>✈</div>
        <h1 className="login__title">Вход в чат</h1>
        <p className="login__hint">
          Данные инстанса из <a href="https://console.green-api.com" target="_blank" rel="noreferrer">личного кабинета GREEN-API</a>
        </p>

        <label className="field">
          <span>apiUrl</span>
          <input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://xxxx.api.green-api.com"
            inputMode="url"
            required
            autoFocus
          />
        </label>
        <label className="field">
          <span>idInstance</span>
          <input value={idInstance} onChange={(e) => setIdInstance(e.target.value)} inputMode="numeric" required />
        </label>
        <label className="field">
          <span>apiTokenInstance</span>
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            required
            autoComplete="off"
          />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
