import React, { useState } from 'react';
import { Scene } from '../types';
import { DownloadIcon, XMarkIcon } from './icons';
import Spinner from './Spinner';

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    scenesToDownload: Scene[];
    allScenes: Scene[];
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, onConfirm, scenesToDownload, allScenes }) => {
    const [isZipping, setIsZipping] = useState(false);

    if (!isOpen) return null;
    
    const handleConfirmClick = async () => {
        setIsZipping(true);
        await onConfirm();
        setIsZipping(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-lg w-full transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-purple-400">Xác nhận Tải Xuống</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" disabled={isZipping}>
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-gray-300 mb-4">
                    Tất cả {scenesToDownload.length} ảnh bạn đã chọn sẽ được nén vào một file <code className="bg-gray-900 px-1 rounded">.zip</code> duy nhất.
                </p>
                <div className="bg-gray-900 border border-gray-700 rounded-md p-4 max-h-60 overflow-y-auto mb-6">
                    <h3 className="font-semibold mb-2 text-gray-200">Các tệp sẽ được bao gồm:</h3>
                    <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                        {scenesToDownload.map((scene) => {
                            const sceneIndex = allScenes.findIndex(s => s.id === scene.id);
                            const sceneNumber = sceneIndex !== -1 ? sceneIndex + 1 : 0;
                            return <li key={scene.id}>scene_{sceneNumber}_selected.png</li>;
                        })}
                    </ul>
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors" disabled={isZipping}>
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleConfirmClick} 
                        className="inline-flex items-center justify-center px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-800 disabled:cursor-wait"
                        disabled={isZipping}
                    >
                        {isZipping ? (
                           <>
                             <Spinner/>
                             <span className="ml-2">Đang nén...</span>
                           </>
                        ) : (
                            <>
                                <DownloadIcon className="w-5 h-5 mr-2" />
                                Tải xuống (.zip)
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DownloadModal;