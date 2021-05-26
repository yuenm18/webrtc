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
  margin: 5px;
  padding: 5px;
  border: 1px solid black;
  border-radius: 10px;
  box-shadow: -2px -2px 8px 2px rgba(0, 0, 0, 0.2);
`;

const FileName = styled.small`
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
  margin: 5px;
`;

const RemoveFiles = styled.div`
  display: flex;
  justify-content: flex-end;
  cursor: pointer;
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
          <Tooltip title="Remove All Files" placement="top">
            <RemoveFiles>
              <CloseFileIcon onClick={removeFilesHandler} />
            </RemoveFiles>
          </Tooltip>
          {files.map((file, index) => <FileName key={index}>{file?.name}</FileName>)}
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
