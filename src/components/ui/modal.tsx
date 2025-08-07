import React, { ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg z-10 max-w-md w-full p-6">
        <button
          className="absolute top-2 right-2 text-gray-600"
          onClick={onClose}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
