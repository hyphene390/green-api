export interface Credentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId: string;
  username?: string;
  phoneNumber?: number;
  fromCache?: boolean;
}

export interface StateInstanceResponse {
  stateInstance: 'notAuthorized' | 'authorized' | 'blocked' | 'starting' | 'yellowCard' | string;
}

export interface NotificationBody {
  typeWebhook: string;
  timestamp?: number;
  idMessage?: string;
  senderData?: {
    chatId: string;
    chatName?: string;
    sender?: string;
    senderName?: string;
    senderContactName?: string;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string };
  };
  [key: string]: unknown;
}

export interface ReceivedNotification {
  receiptId: number;
  body: NotificationBody;
}

export interface Chat {
  chatId: string;
  title: string;
  subtitle?: string;
  lastMessage?: string;
  lastTimestamp?: number;
  unread?: number;
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  direction: 'in' | 'out';
  timestamp: number;
  status?: 'sending' | 'sent' | 'error';
}
