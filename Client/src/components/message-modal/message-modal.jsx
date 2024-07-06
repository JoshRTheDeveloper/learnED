import React from 'react';
import '../message-modal/message-modal.css';

const MessageModal = ({ message, onClose }) => {
  return (
    <div className="modal-overlay5">
      <div className="modal5">
        <div className="modal-header5">
          <h3>Message</h3>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="modal-body5">
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;