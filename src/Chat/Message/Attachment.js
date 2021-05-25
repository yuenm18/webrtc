import React, { useState } from 'react';
import styled from 'styled-components';

const Thumbnail = styled.img`
  max-height: 50px;
  max-width: 50px;
`;

const Attachment = (props) => {
  const [isImage, setIsImage] = useState(true);
  const setNotImage = () => setIsImage(false);
  return (
    <div>
      <a href={props.attachment.url} download={props.attachment.name}>
        {isImage && <Thumbnail src={props.attachment.url} alt={props.attachment.name} onError={setNotImage} />}
        {props.attachment.name}
      </a>
    </div>
  );
};

export default Attachment;