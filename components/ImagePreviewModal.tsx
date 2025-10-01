import React from 'react';

interface ImagePreviewModalProps {
    imageSrc: string;
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageSrc, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div className="relative max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
                <img src={imageSrc} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
                <button 
                    onClick={onClose}
                    className="absolute -top-4 -right-4 bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-700 focus:outline-none"
                    aria-label="Close"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default ImagePreviewModal;
