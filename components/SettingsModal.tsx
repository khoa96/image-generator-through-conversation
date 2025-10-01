import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
    currentApiKey: string | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
    const [localApiKey, setLocalApiKey] = useState(currentApiKey || '');

    useEffect(() => {
        setLocalApiKey(currentApiKey || '');
    }, [currentApiKey, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localApiKey);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-lg w-full transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-purple-400">Cài đặt</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div>
                    <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-300 mb-2">
                        Gemini API Key
                    </label>
                    <input
                        id="api-key-input"
                        type="password"
                        value={localApiKey}
                        onChange={(e) => setLocalApiKey(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Nhập API Key của bạn tại đây"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        API Key của bạn sẽ được lưu trữ an toàn trong trình duyệt. 
                        Bạn có thể lấy key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Google AI Studio</a>.
                    </p>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors">
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Lưu Thay Đổi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;