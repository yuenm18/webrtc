import React, { useState } from 'react';
import styled from 'styled-components';

const Thumbnail = styled.img`
  max-height: 100px;
  max-width: 100px;
`;

const AttachmentContainer = styled.a`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Attachment = (props) => {
  const [isImage, setIsImage] = useState(true);
  const setNotImage = () => setIsImage(false);
  return (
    <AttachmentContainer href={props.attachment.url} download={props.attachment.name}>
      {isImage && <Thumbnail src={props.attachment.url} alt={props.attachment.name} onError={setNotImage} />}
      <div>
        {props.attachment.name}
      </div>
    </AttachmentContainer>
  );
};

export default Attachment;