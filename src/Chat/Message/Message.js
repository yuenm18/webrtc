import React from 'react';
import Attachment from './Attachment';

export default function Message(props) {
  const message = props.message;
  return (
    <div>
      <strong>{message.name}: </strong> {message.message}
      {
        message.attachments.map(attachment => <Attachment attachment={attachment} />)
      }
      <div>
        <em>{new Date(message.timestamp).toLocaleString()}</em>
      </div>
    </div>
  );
}
