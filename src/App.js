import React, { useEffect, useState, useRef  } from 'react';
import Video from './Video/Video';
import Chat from './Chat/Chat';
import './App.css';

import io from 'socket.io-client';

function App(props) {
  let peerConnection = useRef();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

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

    socket.emit('join', props.roomNumber);

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
          callerId: socket.id
        });
      }
    });

    socket.on('offer', async (data) => {
      // define the caller after the offer is created so you don't get into the state
      // where both users think they're the caller
      isCaller = data.callerId === socket.id;

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
          roomNumber: data.roomNumber
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
      if (peerConnection.current.currentRemoteDescription && data.clientId !== socket.id)
        peerConnection.current.addIceCandidate(data.candidate);
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
    <div className="App">
      <Video localStream={localStream} remoteStream={remoteStream} />
      <Chat connection={peerConnection.current} />
    </div>
  );
}

export default App;