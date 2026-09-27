import { useEffect, useRef, useState } from 'react';
import { deleteNotification, GreenApiError, receiveNotification } from '../api/greenApi';
import type { Credentials, NotificationBody } from '../api/types';

const RECEIVE_TIMEOUT_SEC = 20;
const RETRY_DELAYS_MS = [1000, 2000, 5000];

export type PollingStatus = 'polling' | 'standby' | 'error' | 'stopped';

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

export function useNotificationPolling(
  credentials: Credentials,
  onNotification: (body: NotificationBody) => void,
  onAuthError: (message: string) => void,
) {
  const [status, setStatus] = useState<PollingStatus>('standby');
  const [lastError, setLastError] = useState<string | null>(null);

  const handlersRef = useRef({ onNotification, onAuthError });
  useEffect(() => {
    handlersRef.current = { onNotification, onAuthError };
  }, [onNotification, onAuthError]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loop = async () => {
      let failures = 0;
      setStatus('polling');
      setLastError(null);

      while (!signal.aborted) {
        try {
          const notification = await receiveNotification(credentials, RECEIVE_TIMEOUT_SEC, signal);
          if (notification) {
            try {
              handlersRef.current.onNotification(notification.body);
            } catch (handlerError) {
              console.error('Ошибка обработки уведомления', handlerError);
            }
           
            await deleteNotification(credentials, notification.receiptId, signal);
          }
          if (failures) {
            failures = 0;
            setStatus('polling');
            setLastError(null);
          }
        } catch (error) {
          if (signal.aborted) break;
          const message = error instanceof Error ? error.message : String(error);
          setLastError(message);

          const code = error instanceof GreenApiError ? error.status : 0;
          if (code === 401 || code === 403) {
            handlersRef.current.onAuthError(message);
            break;
          }
          if (code === 466) {
            setStatus('stopped');
            break;
          }

          setStatus('error');
          await sleep(RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length - 1)], signal);
          failures += 1;
        }
      }
    };

    if ('locks' in navigator) {
      setStatus('standby');
      navigator.locks
        .request(`greenApi.poll.${credentials.idInstance}`, { signal }, loop)
        .catch(() => {});
    } else {
      void loop();
    }

    return () => controller.abort();
  }, [credentials]);

  return { status, lastError };
}
