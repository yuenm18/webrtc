import React from 'react';
import './Video.css';

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
    <div className="video">
      <video className="local-stream" autoPlay playsInline muted={true} ref={setLocalStream}></video>
      <video autoPlay playsInline ref={setRemoteStream}></video>
      {!props.remoteStream && <a className="copy-link" target="_blank" rel="noopener noreferrer" href={window.location.href}>Go to this link to join this chat</a>}
    </div>
  );
}