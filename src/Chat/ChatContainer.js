import React, { useState } from 'react';
import styled from 'styled-components';
import ChatOutlinedIcon from '@material-ui/icons/ChatOutlined';
import Fab from '@material-ui/core/Fab';
import Chat from './Chat';

const ChatSection = styled.div(props => ({
  display: props.show ? 'block' : 'none',
  height: '100%',
}));

const OpenChatButtonSection = styled.div`
  position: absolute;
  right: 0;
`;

export default function ChatContainer(props) {
  const [showChat, setShowChat] = useState(true);
  const { connection } = props;
  return (
    <div>
      <ChatSection show={showChat}>
        <Chat connection={connection} onClose={() => setShowChat(false)} />
      </ChatSection>
      {!showChat &&
        <OpenChatButtonSection>
          <Fab>
            <ChatOutlinedIcon onClick={() => setShowChat(true)} />
          </Fab>
        </OpenChatButtonSection>
      }
    </div>
  )
}