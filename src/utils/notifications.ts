import type { NotificationBody } from '../api/types';

export interface IncomingText {
  chatId: string;
  idMessage: string;
  text: string;
  timestamp: number;
  senderName?: string;
}


export function extractIncomingText(body: NotificationBody): IncomingText | null {
  if (body.typeWebhook !== 'incomingMessageReceived') return null;

  const { senderData, messageData, idMessage } = body;
  if (!senderData?.chatId || !messageData || !idMessage) return null;

  let text: string | undefined;
  if (messageData.typeMessage === 'textMessage') {
    text = messageData.textMessageData?.textMessage;
  } else if (messageData.typeMessage === 'extendedTextMessage') {
    text = messageData.extendedTextMessageData?.text;
  }
  if (!text) return null;

  return {
    chatId: String(senderData.chatId),
    idMessage,
    text,
    timestamp: body.timestamp ? body.timestamp * 1000 : Date.now(),
    senderName: senderData.chatName || senderData.senderContactName || senderData.senderName,
  };
}
