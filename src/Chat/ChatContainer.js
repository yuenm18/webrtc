import React, { useState } from 'react';
import styled from 'styled-components';
import ChatOutlinedIcon from '@material-ui/icons/ChatOutlined';
import Fab from '@material-ui/core/Fab';
import Tooltip from '@material-ui/core/Tooltip';
import Chat from './ChatPanel';
import { Fragment } from 'react';

const ChatSection = styled.div(props => ({
  display: props.show ? 'block' : 'none',
  height: '100%',
}));

const OpenChatButtonSection = styled.div`
  position: absolute;
  right: 10px;
  top: 10px;
`;

export default function ChatContainer(props) {
  const [showChat, setShowChat] = useState(true);
  const { connection } = props;
  return (
    <Fragment>
      <ChatSection show={showChat}>
        <Chat connection={connection} onClose={() => setShowChat(false)} />
      </ChatSection>
      {!showChat &&
        <OpenChatButtonSection>
          <Tooltip title="Open Chat">
            <Fab>
              <ChatOutlinedIcon onClick={() => setShowChat(true)} />
            </Fab>
          </Tooltip>
        </OpenChatButtonSection>
      }
    </Fragment>
  )
}