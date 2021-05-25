import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import ChatContainer from './Chat/ChatContainer';
import Video from './Video/Video';

import { io } from "socket.io-client";

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
  let peerConnection = useRef();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const socket = io();
    const streamConstraints = { video: true, audio: true };
    const configuration = {
      iceServers: [
        {
          urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    };

    let isCaller;
    let localStream;

    socket.on('connect', () => {
      socket.emit('join', {
        roomNumber: props.roomNumber,
        clientId: socket.id
      });
    });

    socket.on('joined', async (data) => {
      localStream = new MediaStream();
      try {
        localStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
        setLocalStream(localStream);
      } catch (e) {
        console.error('Unable to get media stream', e);
      }

      if (data.isCaller) {
        peerConnection.current = createRTCPeerConnection(localStream);
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        socket.emit('offer', {
          offer: {
            type: offer.type,
            sdp: offer.sdp
          },
          roomNumber: data.roomNumber,
          clientId: socket.id
        });
      }
    });

    socket.on('offer', async (data) => {
      // define the caller after the offer is created so you don't get into the state
      // where both users think they're the caller
      isCaller = data.clientId === socket.id;

      if (!isCaller) {
        peerConnection.current = createRTCPeerConnection(localStream);
        await peerConnection.current.setRemoteDescription(data.offer);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit('answer', {
          answer: {
            type: answer.type,
            sdp: answer.sdp
          },
          roomNumber: data.roomNumber,
          clientId: socket.id
        });
      }
    });

    socket.on('answer', async (data) => {
      if (isCaller) {
        await peerConnection.current.setRemoteDescription(data.answer);
      }

      isCaller = false;
    });

    socket.on('candidate', async (data) => {
      if (data.clientId !== socket.id) {
        retryWhile(
          () => peerConnection.current.currentRemoteDescription,
          () => peerConnection.current.addIceCandidate(data.candidate));
      }
    });

    socket.on('full', () => {
      setIsFull(true);
    });

    function createRTCPeerConnection(stream) {
      const connection = new RTCPeerConnection(configuration);
      connection.createDataChannel('');
      connection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', {
            candidate: {
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              candidate: event.candidate.candidate
            },
            roomNumber: props.roomNumber,
            clientId: socket.id
          })
        }
      }
      connection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      }
      stream.getTracks().forEach(track => {
        connection.addTrack(track, stream);
      });

      return connection;
    }

    return () => socket.disconnect();
  }, [props.roomNumber]);

  return (
    <AppContainer>
      <Video localStream={localStream} remoteStream={remoteStream} />
      <ChatContainer connection={peerConnection.current} />
      {
        isFull &&
        <BannerSection>
          <FullRoomBanner>Room #{props.roomNumber} is full</FullRoomBanner>
        </BannerSection>
      }
    </AppContainer>
  );
}

function retryWhile(condition, func) {
  if (condition()) {
    func()
  }
  else {
    setTimeout(() => retryWhile(condition, func), 1000);
  }
}

export default App;