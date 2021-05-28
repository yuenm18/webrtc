import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ChatContainer from './chat/ChatContainer';
import Video from './video/Video';
import * as connection from '../connection/webrtc-connection';

const AppContainer = styled.section`
  height: 100vh;
  display: flex;
`;

const BannerSection = styled.section`
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FullRoomBanner = styled.h1`
  color: red;
`;

function App(props) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    connection.connect(props.roomNumber, setIsFull, setLocalStream, setRemoteStream);
    return () => connection.disconnect();
  }, [props.roomNumber]);

  return (
    <AppContainer>
      <Video localStream={localStream} remoteStream={remoteStream} />
      <ChatContainer />
      {
        isFull &&
        <BannerSection>
          <FullRoomBanner>Room #{props.roomNumber} is full</FullRoomBanner>
        </BannerSection>
      }
    </AppContainer>
  );
}

export default App;