const socket = io();

const MAX_MESSAGE_SIZE = 2 ** 16 - 1;
const EOF = 'EOF';

const sendMessageForm = document.getElementById('sendMessageForm');
const messageList = document.getElementById('messageList');
const messageTextBox = document.getElementById('messageTextBox');
const filePicker = document.getElementById('filePicker');
const remoteStream = document.getElementById('remoteStream');
const copyLink = document.getElementById('copyLink');

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

copyLink.href = location.href;

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
        remoteStream.srcObject = event.streams[0];
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
                writeMessage(JSON.parse(messageEvent.data), 'Stranger');
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
                writeFile(JSON.parse(messageEvent.data), 'Stranger');
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
        addAttachmentListener(peerConnection);
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
        addAttachmentListener(peerConnection);
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
});

sendMessageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = messageTextBox.value;
    if (text) {
        let message = {
            timestamp: new Date().getTime(),
            message: text
        };

        const file = filePicker.files[0];
        if (file) {
            const attachmentId = `attachment-${new Date().getTime()}`;
            message.attachment = {
                id: attachmentId,
                name: file.name,
                mimeType: file.mimeType
            };

            sendFile(file, attachmentId, peerConnection);

            filePicker.value = '';
        }

        messageChannel.send(JSON.stringify(message));
        writeMessage(message, 'You');
        if (file) {
            writeFile(file, message.attachment.id);
        }

        messageTextBox.value = '';
    }
});

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

function writeMessage(message, name) {
    var p = document.createElement('p');
    var strong = document.createElement('strong');
    strong.textContent = name + ': ';
    var txtNode = document.createTextNode(message.message);
    let div = document.createElement('div')
    const em = document.createElement('em');
    em.textContent = new Date(message.timestamp).toLocaleString();
    div.appendChild(em);

    p.appendChild(strong);
    p.appendChild(txtNode);
    if (message.attachment) {
        let div = document.createElement('div')
        var linkNode = document.createElement('a');
        linkNode.id = message.attachment.id
        linkNode.download = message.attachment.name;
        linkNode.textContent = message.attachment.name;
        div.appendChild(linkNode);
        p.appendChild(div);
    }

    p.appendChild(div);
    messageList.appendChild(p);
}

function writeFile(file, id) {
    const blob = new Blob([file]);
    const url = URL.createObjectURL(blob);

    document.getElementById(id).href = url;
}