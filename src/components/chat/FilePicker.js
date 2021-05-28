import React, { useRef } from 'react';
import styled from 'styled-components';
import IconButton from '@material-ui/core/IconButton';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import CloseFileIcon from '@material-ui/icons/Close';
import Badge from '@material-ui/core/Badge';
import Tooltip from '@material-ui/core/Tooltip';

const FilePickerContainer = styled.div`
  display: inline-block;
`;

const FileInput = styled.input`
  display: none;
`;

const SelectedFilesContainer = styled.div`
  position: relative;
`;

const SelectedFilesPopover = styled.div`
  position: absolute;
  bottom: 0;
  border: 1px solid black;
  border-radius: 10px;
  box-shadow: -2px -2px 8px 2px rgba(0, 0, 0, 0.2);
  background: white;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  max-width: 20vw
`;

const FileNameContainer = styled.div`
  margin: 5px;
  padding: 5px;
`;

const FileName = styled.small`
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 10vw;
  margin: 5px;
`;

const RemoveFiles = styled.div`
  cursor: pointer;
  margin: 5px;
`;

export default function FilePicker(props) {
  const fileInputRef = useRef();
  const { files, disabled } = props;

  function onChangeHandler(selectedFiles) {
    props.onFilesSelected(files.concat(...selectedFiles));
    fileInputRef.current.value = '';
  }

  function removeFilesHandler() {
    props.onFilesSelected([]);
  }

  return (
    <FilePickerContainer>
      {!!files.length && <SelectedFilesContainer>
        <SelectedFilesPopover>
          <FileNameContainer>
            {files.map((file, index) => <FileName key={index} title={file?.name}>{file?.name}</FileName>)}
          </FileNameContainer>
          <RemoveFiles>
            <Tooltip title="Remove All Files" placement="top">
              <CloseFileIcon onClick={removeFilesHandler} />
            </Tooltip>
          </RemoveFiles>
        </SelectedFilesPopover>
      </SelectedFilesContainer>}
      <FileInput id="file-picker" type="file" multiple onChange={(event) => onChangeHandler(event.target.files)} ref={fileInputRef} disabled={disabled} />
      <label htmlFor="file-picker">
        <Tooltip title="Select Files">
          <IconButton color="secondary" aria-label="upload file" component="span" disabled={disabled}>
            <Badge badgeContent={files.length} color="secondary">
              <AttachFileIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      </label>
    </FilePickerContainer>
  );
}
