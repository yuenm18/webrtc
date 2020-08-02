const socket = io();

const sendButton = document.getElementById('sendButton');
const messageList = document.getElementById('messageList');
const messageTextBox = document.getElementById('messageTextBox');
const filePicker = document.getElementById('filePicker');

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

const roomNumber = new URLSearchParams(location.search).get("room");
if (roomNumber == null) {
    const newRoomNumber = crypto.getRandomValues(new Uint8Array(16))
        .join('');
    location = `?room=${newRoomNumber}`;
}

let peerConnection;
let localStream;
let isCaller;
let messageChannel;
let fileChannel;

function createRTCPeerConnection(stream) {
    const connection = new RTCPeerConnection(configuration);
    connection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', {
                candidate: {
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    candidate: event.candidate.candidate
                },
                roomNumber
            })
        }
    }
    connection.ontrack = (event) => {
        document.getElementById('remoteStream').srcObject = event.streams[0];
    }
    stream.getTracks().forEach(track => {
        connection.addTrack(track, stream);
    });

    return connection;
}

function createMessageChannel(connection) {
    const label = 'messageChannel';
    const channel = connection.createDataChannel(label);
    channel.onopen = () => sendButton.disabled = false;
    channel.onclose = () => sendButton.disabled = true;
    connection.addEventListener('datachannel', (event) => {
        if (event.channel.label === label) {
            event.channel.onmessage = (messageEvent) => {
                writeMessage(messageEvent.data, 'Stranger');
            }
        }
    });
    
    return channel;
}

function createFileChannel(connection) {
    const label = 'fileChannel';
    const channel = connection.createDataChannel(label);
    channel.binaryType = 'arraybuffer';
    channel.onopen = () => filePicker.disabled = false;
    channel.onclose = () => filePicker.disabled = true;
    connection.addEventListener('datachannel', (event) => {
        if (event.channel.label === label) {
            event.channel.onmessage = (messageEvent) => {
                writeFile(messageEvent.data, 'Stranger');
            }
        }
    });
    
    return channel;
}

socket.emit('join', roomNumber);

socket.on('joined', async (data) => {
    isCaller = data.isCaller;
    localStream = new MediaStream();
    try {
        localStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
        document.getElementById('localStream').srcObject = new MediaStream(localStream.getVideoTracks());
    } catch (e) {
        console.error('Unable to get media stream', e);
    }

    if (data.isCaller) {
        peerConnection = createRTCPeerConnection(localStream);
        messageChannel = createMessageChannel(peerConnection);
        fileChannel = createFileChannel(peerConnection);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('offer', {
            offer: {
                type: offer.type,
                sdp: offer.sdp
            },
            roomNumber: data.roomNumber
        });
    }
});

socket.on('offer', async (data) => {
    if (!isCaller) {
        peerConnection = createRTCPeerConnection(localStream);
        messageChannel = createMessageChannel(peerConnection);
        fileChannel = createFileChannel(peerConnection);
        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
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
        await peerConnection.setRemoteDescription(data.answer);
    }

    isCaller = false;
});

socket.on('candidate', async (data) => {
    if (peerConnection.currentRemoteDescription)
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
})

sendButton.addEventListener('click', (event) => {
    const message = messageTextBox.value;
    if (message) {
        messageChannel.send(message);
        writeMessage(message, 'You');
        messageTextBox.value = '';
    }
});

filePicker.addEventListener('change', async (event) => {
    const file = filePicker.files[0];
    if (file) {
        fileChannel.send(await file.arrayBuffer());
        writeFile(file, 'You');
        filePicker.value='';
    }
});

function writeMessage(message, name) {
    var p = document.createElement('p');
    var strong = document.createElement('strong');
    strong.textContent = name + ': ';
    var txtNode = document.createTextNode(message);
    
    p.appendChild(strong);
    p.appendChild(txtNode);
    messageList.appendChild(p);
}

function writeFile(file, name) {
    
    const blob = new Blob([file]);
    const url = URL.createObjectURL(blob);
    
    var p = document.createElement('p');
    var strong = document.createElement('strong');
    strong.textContent = name + ': ';
    var linkNode = document.createElement('a');
    linkNode.href = url;
    linkNode.target = '_blank';
    linkNode.textContent = 'File';
    
    p.appendChild(strong);
    p.appendChild(linkNode);
    messageList.appendChild(p);
}