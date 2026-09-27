import { useEffect, useState } from 'react';

type StorageType = 'local' | 'session';

function getStorage(type: StorageType): Storage | null {
  try {
    return type === 'local' ? window.localStorage : window.sessionStorage;
  } catch (error) {
    console.error('Хранилище недоступно', error);
    return null;
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  try {
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** useState, сохраняемый в Storage и синхронизируемый между вкладками. */
export function useStoredState<T>(key: string, initialValue: T, type: StorageType = 'local') {
  const [initial] = useState(initialValue);
  const [value, setValue] = useState<T>(() => parse(getStorage(type)?.getItem(key) ?? null, initial));

  useEffect(() => {
    const storage = getStorage(type);
    try {
      if (value === null || value === undefined) storage?.removeItem(key);
      else storage?.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Не удалось сохранить данные', error);
    }
  }, [key, value, type]);

  useEffect(() => {
    const storage = getStorage(type);
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === storage && event.key === key) setValue(parse(event.newValue, initial));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, type, initial]);

  return [value, setValue] as const;
}
