import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FilePicker from './FilePicker';
import { v4 as uuidv4 } from 'uuid';

export default function SendMessage(props) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const disabled = props.disabled;

  const onSubmitHandler = (event) => {
    event.preventDefault();

    let message = {
      id: uuidv4(),
      timestamp: new Date().getTime(),
      message: text,
      attachments: attachments.map(attachment => ({
        id: uuidv4(),
        name: attachment.name,
        mimeType: attachment.mimeType ?? attachment.type,
        file: attachment
      }))
    };

    setText('');
    setAttachments([]);

    props.onSubmit(message);
  };
  return (
    <div>
      <form id="sendMessageForm" autoComplete="off" onSubmit={onSubmitHandler}>
        <TextField id="messageTextBox" label="Message" value={text} onChange={(event) => setText(event.target.value)} />
        <Button id="sendButton" variant="contained" color="primary" type="submit" disabled={disabled}>Send</Button>
        <FilePicker disabled={disabled} files={attachments} onFilesSelected={files => setAttachments(files)} />
      </form>
    </div>
  )
}