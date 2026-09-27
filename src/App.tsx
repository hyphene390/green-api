import { useState } from 'react';
import { useStoredState } from './hooks/useStoredState';
import type { Credentials } from './api/types';
import LoginForm from './components/LoginForm';
import ChatApp, { storageKeys } from './components/ChatApp';

export default function App() {
  const [credentials, setCredentials] = useStoredState<Credentials | null>('greenApi.credentials', null, 'session');
  const [logoutReason, setLogoutReason] = useState<string | null>(null);

  if (!credentials) return <LoginForm initialError={logoutReason} onLogin={setCredentials} />;

  const logout = () => {
    try {
      Object.values(storageKeys(credentials.idInstance)).forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('Не удалось очистить localStorage', error);
    }
    setLogoutReason(null);
    setCredentials(null);
  };

  const handleAuthError = (message: string) => {
    setLogoutReason(message);
    setCredentials(null);
  };

  return (
    <ChatApp
      key={credentials.idInstance}
      credentials={credentials}
      onLogout={logout}
      onAuthError={handleAuthError}
    />
  );
}
