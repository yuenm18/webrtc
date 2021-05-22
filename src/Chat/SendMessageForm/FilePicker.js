import React, { useRef } from 'react';
import IconButton from '@material-ui/core/IconButton';
import AttachFileIcon from '@material-ui/icons/AttachFile';

export default function FilePicker(props) {
  const fileInputRef = useRef();
  const sendDisabled = props.sendDisabled;
  const files = props.files;

  function onChangeHandler(selectedFiles) {
    props.onFilesSelected(files.concat(...selectedFiles));
    fileInputRef.current.value = '';
  }

  return (
    <div>
      <input id="file-picker" type="file" multiple onChange={(event) => onChangeHandler(event.target.files)} ref={fileInputRef} disabled={sendDisabled} />
      <label htmlFor="file-picker">
        <IconButton color="secondary" aria-label="upload file" component="span" disabled={sendDisabled}>
          <AttachFileIcon />
        </IconButton>
      </label>
      <div className="file-name-container">
        { files.map((file, index) => <small key={index} className="file-name">{file?.name}</small>) }
      </div>
    </div>
  );
}
