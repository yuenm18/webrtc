import React, { useState } from 'react';
import styled from 'styled-components';
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import SendMessageForm from './SendMessageForm';
import Message from './Message';
import * as connection from '../../connection/webrtc-connection';
import * as chatSender from '../../connection/chat-sender';

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
  const [isConnected, setIsConnected] = useState(false);

  connection.registerIsConnectedHandler('Chat', setIsConnected);
  chatSender.routeChatListener(writeChatMessage);

  function onSubmitHandler(message) {
    writeMessage(message, 'You');
    for (let attachment of message.attachments) {
      writeFile(attachment.fileContent, message.id, attachment.id);
    }

    chatSender.sendChat(message)
  };

  function writeChatMessage(message) {
    writeMessage(message, 'Stranger');
    for (let attachment of message.attachments) {
      writeFile(attachment.fileContent, message.id, attachment.id);
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
      <Tooltip title="Close Chat">
        <CloseIcon onClick={() => props.onClose()} />
      </Tooltip>
      <Typography variant="h4" component="h2">Chat</Typography>
      <MessageList>
        {
          messages.map(m => <Message key={m.id} message={m} />)
        }
      </MessageList>
      <SendMessageForm disabled={!isConnected} onSubmit={onSubmitHandler} />
    </ChatContainer>
  );
}
