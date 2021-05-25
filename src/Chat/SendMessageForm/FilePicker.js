import React, { useRef } from 'react';
import styled from 'styled-components';
import IconButton from '@material-ui/core/IconButton';
import AttachFileIcon from '@material-ui/icons/AttachFile';

const FilePickerContainer = styled.div`
  display: inline-block;
`;

const FileInput = styled.input`
  display: none;
`;

const FileNameContainer = styled.div`
  position: relative;
  height: 10px;
`;

const FileName = styled.small`
  position: absolute;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
`;

export default function FilePicker(props) {
  const fileInputRef = useRef();
  const sendDisabled = props.sendDisabled;
  const files = props.files;

  function onChangeHandler(selectedFiles) {
    props.onFilesSelected(files.concat(...selectedFiles));
    fileInputRef.current.value = '';
  }

  return (
    <FilePickerContainer>
      <FileInput id="file-picker" type="file" multiple onChange={(event) => onChangeHandler(event.target.files)} ref={fileInputRef} disabled={sendDisabled} />
      <label htmlFor="file-picker">
        <IconButton color="secondary" aria-label="upload file" component="span" disabled={sendDisabled}>
          <AttachFileIcon />
        </IconButton>
      </label>
      <FileNameContainer>
        { files.map((file, index) => <FileName key={index}>{file?.name}</FileName>) }
      </FileNameContainer>
    </FilePickerContainer>
  );
}
