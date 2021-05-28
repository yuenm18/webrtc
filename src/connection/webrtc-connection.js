import { io } from 'socket.io-client';
import { EventHandler } from './event-handler';

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

const EOF = 'EOF';
const MAX_MESSAGE_SIZE = 2 ** 16 - 1;
const streamConstraints = { video: true, audio: true };

let socket;
let webrtcPeerConnection;
const messageHandler = new EventHandler();
const isConnectedHandler = new EventHandler();

export function connect(roomNumber, onIsFull, onLocalStream, onRemoteStream) {
  let localStream = null;
  let isCaller = false;

  socket = io();

  socket.on('connect', () => {
    socket.emit('join', {
      roomNumber: roomNumber,
      clientId: socket.id
    });
  });

  socket.on('joined', async (data) => {
    localStream = new MediaStream();
    try {
      localStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
      onLocalStream(localStream);
    } catch (e) {
      console.error('Unable to get media stream', e);
    }

    if (data.isCaller) {
      webrtcPeerConnection = createRTCPeerConnection(localStream);
      const offer = await webrtcPeerConnection.createOffer();
      await webrtcPeerConnection.setLocalDescription(offer);

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
      webrtcPeerConnection = createRTCPeerConnection(localStream);
      await webrtcPeerConnection.setRemoteDescription(data.offer);
      const answer = await webrtcPeerConnection.createAnswer();
      await webrtcPeerConnection.setLocalDescription(answer);
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
      await webrtcPeerConnection.setRemoteDescription(data.answer);
    }

    isCaller = false;
  });

  socket.on('candidate', async (data) => {
    if (data.clientId !== socket.id) {
      retryWhile(
        () => webrtcPeerConnection.currentRemoteDescription,
        () => webrtcPeerConnection.addIceCandidate(data.candidate));
    }
  });

  socket.on('full', () => {
    onIsFull(true);
  });

  const createRTCPeerConnection = (stream) => {
    const connection = new RTCPeerConnection(configuration);
    connection.createDataChannel('');
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', {
          candidate: {
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate
          },
          roomNumber: roomNumber,
          clientId: socket.id
        })
      }
    }
    connection.ontrack = (event) => {
      onRemoteStream(event.streams[0]);
    }

    stream.getTracks().forEach(track => {
      connection.addTrack(track, stream);
    });

    connection.onconnectionstatechange = (event) => {
      console.log(event.target.connectionState);
      if (event.target.connectionState === 'connected') {
        isConnectedHandler.handle(true);
      } else {
        isConnectedHandler.handle(false);
      }
    }

    connection.addEventListener('datachannel', (event) => {
      const { channel } = event;
      console.log(channel.label);

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

            messageHandler.handle(channel.label, arrayBuffer);
            channel.close();
          }
        } catch (err) {
          console.log('File transfer failed', err);
          channel.close();
        }
      }
    });

    return connection;
  }
}

export const disconnect = () => socket.disconnect();

export function sendBinary(label, arrayBuffer) {
  //https://levelup.gitconnected.com/send-files-over-a-data-channel-video-call-with-webrtc-step-6-d38f1ca5a351
  const channel = webrtcPeerConnection.createDataChannel(label);
  channel.binaryType = 'arraybuffer';
  channel.onopen = () => {
    for (let i = 0; i < arrayBuffer.byteLength; i += MAX_MESSAGE_SIZE) {
      channel.send(arrayBuffer.slice(i, i + MAX_MESSAGE_SIZE));
    }

    channel.send(EOF);
  }
}

export const registerMessageHandler = messageHandler.registerHandler;

export const registerIsConnectedHandler = isConnectedHandler.registerHandler;

function retryWhile(condition, func) {
  if (condition()) {
    func()
  }
  else {
    setTimeout(() => retryWhile(condition, func), 1000);
  }
}