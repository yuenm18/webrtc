import React, { useState } from 'react';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FilePicker from './FilePicker';
import { v4 as uuidv4 } from 'uuid';

const FormContainer = styled.form`
  display: flex;
  margin-top: 10px;
`;
const MessageInput = styled(TextField)`
  flex: 1;
`;
const SendButtonContainer = styled.div`
  margin: auto;
  margin-left: 10px;
`;

export default function SendMessageForm(props) {
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
    <FormContainer autoComplete="off" onSubmit={onSubmitHandler}>
      <FilePicker disabled={disabled} files={attachments} onFilesSelected={files => setAttachments(files)} />
      <MessageInput label="Message" value={text} onChange={(event) => setText(event.target.value)} />
      <SendButtonContainer><Button variant="contained" color="primary" type="submit" disabled={disabled}>Send</Button></SendButtonContainer>
    </FormContainer>
  )
}