import React, { useState } from 'react';
import './Message.css';

export default function Message(props) {
  const message = props.message;
  return (
    <div>
      <strong>{message.name}: </strong> {message.message}
      {
        message.attachment && <Attachment attachment={message.attachment} />
      }
      <div>
        <em>{new Date(message.timestamp).toLocaleString()}</em>
      </div>
    </div>
  );
}

const Attachment = (props) => {
  const [isImage, setIsImage] = useState(true);
  const setNotImage = () => setIsImage(false);
  return (
    <div>
      <a href={props.attachment.url} download={props.attachment.name}>
        {isImage && <img src={props.attachment.url} alt={props.attachment.name} className="preview" onError={setNotImage} />}
        {props.attachment.name}
      </a>
    </div>
  );
}