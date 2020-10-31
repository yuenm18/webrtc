import React, { useEffect, useState, useRef } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined';
import './Chat.css';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import Message from './Message/Message';

const EOF = 'EOF';
const MAX_MESSAGE_SIZE = 2 ** 16 - 1;

export default function Chat(props) {
  const [text, setText] = useState('');
  const [file, setFile] = useState();
  const [messages, setMessages] = useState([]);
  const fileInputRef = useRef();
  const messageChannelRef = useRef();
  const [sendDisabled, setSendDisabled] = useState(true);
  const peerConnection = props.connection;

  useEffect(() => {
    const peerConnection = props.connection;
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
        if (channel.label.startsWith('attachment-')) {
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
                writeFile(blob, channel.label);
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
  }, [props.connection])

  const onSubmitHandler = (event) => {
    event.preventDefault();

    if (text) {
      let message = {
        timestamp: new Date().getTime(),
        message: text
      };

      if (file) {
        const attachmentId = `attachment-${new Date().getTime()}`;
        message.attachment = {
          id: attachmentId,
          name: file.name,
          mimeType: file.mimeType
        };

        sendFile(file, attachmentId, peerConnection);

        fileInputRef.current.value = '';
      }

      messageChannelRef.current.send(JSON.stringify(message));
      writeMessage(message, 'You');
      if (file) {
        writeFile(file, message.attachment.id);
        setFile('');
      }

      setText('');
    }
  };

  function sendFile(file, fileId, connection) {
    //https://levelup.gitconnected.com/send-files-over-a-data-channel-video-call-with-webrtc-step-6-d38f1ca5a351
    const channel = connection.createDataChannel(fileId);
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

  function writeFile(file, id) {
    const blob = new Blob([file]);
    const url = URL.createObjectURL(blob);

    setMessages(messages =>
      messages.map(m => {
        if (m.attachment?.id === id) {
          return {
            ...m,
            attachment: {
              ...m.attachment,
              url
            }
          }
        }

        return m;
      })
    );
  }
  return (
    <div className="chat">
      <CloseOutlinedIcon className="close-icon" onClick={() => props.onClose()} />
      <Typography variant="h4" component="h2">Chat</Typography>
      <div className="message-list">
        {
          messages.map(m => <Message key={m.timestamp} message={m} />)
        }
      </div>
      <form id="sendMessageForm" autoComplete="off" onSubmit={onSubmitHandler}>
        <input id="file-picker" type="file" onChange={(event) => setFile(event.target.files[0])} ref={fileInputRef} disabled={sendDisabled} />
        <label htmlFor="file-picker">
          <IconButton color="secondary" aria-label="upload file" component="span" disabled={sendDisabled}>
            <AttachFileIcon />
          </IconButton>
        </label>
        <TextField id="messageTextBox" label="Message" value={text} onChange={(event) => setText(event.target.value)} />
        <Button id="sendButton" variant="contained" color="primary" type="submit" disabled={sendDisabled}>Send</Button>
        <div className="file-name-container">
          <small className="file-name">{file?.name}</small>
        </div>
      </form>
    </div>
  );
}
