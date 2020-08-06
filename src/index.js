import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';


const roomNumber = new URLSearchParams(window.location.search).get("room");
if (roomNumber == null) {
    const newRoomNumber = crypto.getRandomValues(new Uint8Array(16))
        .join('');
    window.location = `?room=${newRoomNumber}`;
}

ReactDOM.render(
  <React.StrictMode>
    <App roomNumber={roomNumber} />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
