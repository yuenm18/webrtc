import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined';
import Typography from '@material-ui/core/Typography';
import SendMessageForm from './SendMessageForm/SendMessageForm';
import Message from './Message/Message';

const ATTACHMENT_CHANNEL_PREFIX = 'attachment';
const EOF = 'EOF';
const MAX_MESSAGE_SIZE = 2 ** 16 - 1;

const MessageList = styled.div`
  margin-top: 10px;
  overflow-y: auto;
  flex: 1;
`;

const CloseIcon = styled(CloseOutlinedIcon)`
  margin: 8px;
  cursor: pointer;
  right: 0;
  position: absolute;
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100% - 16px);
  background-color: white;
  padding: 8px;
  max-width: 400px;
  box-shadow: black 1px 0 10px;
  position: relative;
  width: 30vw;
`;


export default function ChatPanel(props) {
  const [messages, setMessages] = useState([]);
  const [sendDisabled, setSendDisabled] = useState(true);
  const messageChannelRef = useRef();
  const peerConnection = props.connection;

  useEffect(() => {
    if (!peerConnection) return;

    function createMessageChannel(connection) {
      const label = 'messageChannel';
      const channel = connection.createDataChannel(label);
      channel.onopen = () => setSendDisabled(false);
      channel.onclose = () => setSendDisabled(true);
      connection.addEventListener('datachannel', (event) => {
        if (event.channel.label === label) {
          event.channel.onmessage = (messageEvent) => {
            writeMessage(JSON.parse(messageEvent.data), 'Stranger');
          }
        }
      });

      return channel;
    }

    function addAttachmentListener(connection) {
      connection.addEventListener('datachannel', (event) => {
        const { channel } = event;
        if (isAttachmentChannel(channel)) {
          channel.binaryType = 'arraybuffer';

          const receivedBuffers = [];
          channel.onmessage = async (event) => {
            const data = event.data;
            try {
              if (data !== EOF) {
                receivedBuffers.push(data);
              } else {
                const arrayBuffer = receivedBuffers.reduce((accumulatedBuffer, arrayBuffer) => {
                  const temp = new Uint8Array(accumulatedBuffer.byteLength + arrayBuffer.byteLength);
                  temp.set(accumulatedBuffer);
                  temp.set(new Uint8Array(arrayBuffer), accumulatedBuffer.byteLength);
                  return temp;
                }, new Uint8Array());

                const blob = new Blob([arrayBuffer]);
                const parsedChannelLabel = parseAttachmentChannelLabel(channel.label);
                writeFile(blob, parsedChannelLabel.messageId, parsedChannelLabel.fileId);
                channel.close();
              }
            } catch (err) {
              console.log('File transfer failed', err);
            }
          }
        }
      });
    }

    messageChannelRef.current = createMessageChannel(peerConnection);
    addAttachmentListener(peerConnection);
  }, [peerConnection])

  function onSubmitHandler(message) {
    messageChannelRef.current.send(JSON.stringify(message));
    writeMessage(message, 'You');
    for (let attachment of message.attachments) {
      sendFile(attachment.file, message.id, attachment.id, peerConnection);
      writeFile(attachment.file, message.id, attachment.id);
    }
  };

  function sendFile(file, messageId, fileId, connection) {
    //https://levelup.gitconnected.com/send-files-over-a-data-channel-video-call-with-webrtc-step-6-d38f1ca5a351
    const channel = connection.createDataChannel(buildAttachmentChannelLabel(messageId, fileId));
    channel.binaryType = 'arraybuffer';
    channel.onopen = async () => {
      const arrayBuffer = await file.arrayBuffer();
      for (let i = 0; i < arrayBuffer.byteLength; i += MAX_MESSAGE_SIZE) {
        channel.send(arrayBuffer.slice(i, i + MAX_MESSAGE_SIZE));
      }

      channel.send(EOF);
    }
  }

  function writeMessage(message, name) {
    setMessages(messages => [...messages, {
      ...message,
      name
    }]);
  }

  function writeFile(file, messageId, fileId) {
    const blob = new Blob([file]);
    const url = URL.createObjectURL(blob);

    setMessages(messages => {
      return messages.map(message => {
        if (message?.id === messageId) {
          message.attachments = message.attachments.map(attachment => {
            if (attachment?.id === fileId) {
              attachment.url = url;
            }

            return attachment;
          });
        }

        return message;
      });
    });
  }

  return (
    <ChatContainer>
      <CloseIcon onClick={() => props.onClose()} />
      <Typography variant="h4" component="h2">Chat</Typography>
      <MessageList>
        {
          messages.map(m => <Message key={m.timestamp} message={m} />)
        }
      </MessageList>
      <SendMessageForm disabled={sendDisabled} onSubmit={onSubmitHandler} />
    </ChatContainer>
  );
}

function parseAttachmentChannelLabel(channelLabel) {
  const channelLabelParts = channelLabel.split(':');
  return {
    messageId: channelLabelParts[1],
    fileId: channelLabelParts[2]
  }
}

function buildAttachmentChannelLabel(messageId, fileId) {
  return `${ATTACHMENT_CHANNEL_PREFIX}:${messageId}:${fileId}`;
}

function isAttachmentChannel(channel) {
  return channel.label.startsWith(ATTACHMENT_CHANNEL_PREFIX)
}