import React from 'react';
import styled from 'styled-components';

const VideoContainer = styled.div`
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: black;
`;

const RemoteStream = styled.video`
  // flex: 2;
`;

const LocalStream = styled.video`
  position: fixed;
  left: 8px;
  top: 8px;
  height: 10%;
  width: 10%
`;

export default function Video(props) {
  const setLocalStream = (video) => {
    if (video) {
      video.srcObject = props.localStream;
    }
  };

  const setRemoteStream = (video) => {
    if (video) {
      video.srcObject = props.remoteStream;
    }
  };

  return (
    <VideoContainer>
      <LocalStream autoPlay playsInline muted={true} ref={setLocalStream}></LocalStream>
      <RemoteStream autoPlay playsInline ref={setRemoteStream}></RemoteStream>
    </VideoContainer>
  );
}