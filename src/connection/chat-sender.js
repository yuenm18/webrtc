import * as connection from './webrtc-connection';
import * as avro from 'avro-js';

const chatType = avro.parse({
  name: 'Chat',
  type: 'record',
  fields: [
    { name: 'id', type: { type: 'string', logicalType: 'uuid' } },
    { name: 'message', type: 'string' },
    { name: 'timestamp', type: { type: 'long', logicalType: 'timestamp-millis' } },
    {
      name: 'attachments',
      type: {
        type: 'array',
        items: {
          name: 'Attachment',
          type: 'record',
          fields: [
            { name: 'id', type: { type: 'string', logicalType: 'uuid' } },
            { name: 'name', type: 'string' },
            { name: 'mimeType', type: 'string' },
            { name: 'fileContent', type: 'bytes' },
          ]
        }
      }
    }
  ]
});

const CHAT_CHANNEL_PREFIX = 'chat';

export function routeChatListener(messageReceived) {
  connection.registerMessageHandler(CHAT_CHANNEL_PREFIX, (label, arrayBuffer) => {
    if (isChatChannel(label)) {
      const chatMessage = chatType.fromBuffer(Buffer.from(arrayBuffer.buffer));
      messageReceived(chatMessage);
    }
  });
}

export function sendChat(chatMessage) {
  const normalizedChatMessage = { ...chatMessage };
  normalizedChatMessage.attachments = normalizedChatMessage.attachments.map(a => {
    a.fileContent = Buffer.from(a.fileContent);
    return a;
  });
  const arrayBuffer = chatType.toBuffer(normalizedChatMessage);
  connection.sendBinary(buildChatChannelLabel(chatMessage.id), arrayBuffer);
}

function isChatChannel(label) {
  return label.startsWith(CHAT_CHANNEL_PREFIX);
}

function buildChatChannelLabel(messageId) {
  return `${CHAT_CHANNEL_PREFIX}-${messageId}`;
}
