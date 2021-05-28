import React from 'react';
import Attachment from './Attachment';
import styled from 'styled-components';

const MessageContainer = styled.div(props => ({
  'background-color': props.isMyMessage ? 'lightskyblue' : 'darkseagreen',
  'box-shadow': '0 0 8px 2px rgba(0, 0, 0, 0.2)',
  'overflow-wrap': 'break-word',
  'border-radius': '10px',
  margin: '10px',
  padding: '10px'
}));

const AttachmentContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  overflow: hidden;
  & > * {
    margin: 10px;
  }
`;

const DateDisplay = styled.div`
  margin-top: 0.5em;
  font-size: .75em;
  font-style: italic;
`;

export default function Message(props) {
  const message = props.message;
  return (
    <MessageContainer isMyMessage={message.name === 'You'}>
      <strong>{message.name}: </strong> {message.message}

      <AttachmentContainer>
      {
        message.attachments.map(attachment => <Attachment key={attachment.id} attachment={attachment} />)
      }
      </AttachmentContainer>
      <DateDisplay>{new Date(message.timestamp).toLocaleString()}</DateDisplay>
    </MessageContainer>
  );
}
