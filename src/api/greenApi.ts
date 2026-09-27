import type {
  CheckAccountResponse,
  Credentials,
  ReceivedNotification,
  SendMessageResponse,
  StateInstanceResponse,
} from './types';

export class GreenApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'GreenApiError';
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 30_000;

function buildUrl({ apiUrl, idInstance, apiTokenInstance }: Credentials, method: string, suffix = '') {
  return `${apiUrl}/waInstance${encodeURIComponent(idInstance)}/${method}/${encodeURIComponent(apiTokenInstance)}${suffix}`;
}

async function request<T>(url: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const timeout = AbortSignal.timeout(timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
      signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  } catch (error) {
    if (timeout.aborted) throw new GreenApiError(0, 'Сервер GREEN-API не отвечает');
    throw error;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new GreenApiError(response.status, describeError(response.status, text));
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

function describeError(status: number, body: string): string {
  if (status === 401 || status === 403) return 'Неверный idInstance или apiTokenInstance';
  if (status === 429) return 'Слишком много запросов, попробуйте позже';
  if (status === 466) return 'Исчерпан лимит запросов по тарифу';
  return `Ошибка GREEN-API (${status})${body ? `: ${body.slice(0, 200)}` : ''}`;
}

export function getStateInstance(creds: Credentials, signal?: AbortSignal) {
  return request<StateInstanceResponse>(buildUrl(creds, 'getStateInstance'), { signal });
}

export function checkAccount(
  creds: Credentials,
  target: { phoneNumber: string } | { username: string },
  signal?: AbortSignal,
) {
  const body = 'phoneNumber' in target
    ? { phoneNumber: Number(target.phoneNumber) }
    : { username: target.username };
  return request<CheckAccountResponse>(buildUrl(creds, 'checkAccount'), {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  });
}

export function sendMessage(creds: Credentials, chatId: string, message: string, signal?: AbortSignal) {
  return request<SendMessageResponse>(buildUrl(creds, 'sendMessage'), {
    method: 'POST',
    body: JSON.stringify({ chatId, message }),
    signal,
  });
}

// Возвращает null, если в очереди нет уведомлений
export function receiveNotification(creds: Credentials, receiveTimeout: number, signal?: AbortSignal) {
  return request<ReceivedNotification | null>(
    buildUrl(creds, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`),
    { signal },
    (receiveTimeout + 10) * 1000,
  );
}

export function deleteNotification(creds: Credentials, receiptId: number, signal?: AbortSignal) {
  return request<{ result: boolean }>(buildUrl(creds, 'deleteNotification', `/${receiptId}`), {
    method: 'DELETE',
    signal,
  });
}
