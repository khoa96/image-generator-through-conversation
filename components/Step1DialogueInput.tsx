import React, { useState } from 'react';

interface Step1DialogueInputProps {
    onAnalyze: (dialogue: string) => void;
    initialDialogue: string;
    isApiKeySet: boolean;
}

const Step1DialogueInput: React.FC<Step1DialogueInputProps> = ({ onAnalyze, initialDialogue, isApiKeySet }) => {
    const [dialogue, setDialogue] = useState(initialDialogue);

    const handleAnalyzeClick = () => {
        if (isApiKeySet && dialogue.trim()) {
            onAnalyze(dialogue);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-2 text-center text-purple-400">Bước 1/3: Nhập Kịch Bản Hội Thoại</h2>
            <p className="text-gray-400 text-center mb-6">Dán kịch bản hội thoại vào ô bên dưới. AI sẽ tự động phân tích nhân vật và các phân cảnh.</p>
            <textarea
                value={dialogue}
                onChange={(e) => setDialogue(e.target.value)}
                className="w-full h-80 p-4 bg-gray-900 border-2 border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200 resize-none"
                placeholder="Dán kịch bản hội thoại của bạn vào đây. Ví dụ:&#10;JOHN: Chào Jane, hôm nay thời tiết đẹp quá!&#10;JANE: Vâng, tôi cũng thấy vậy. Anh có muốn đi dạo không?"
            />
            <div className="mt-6 text-center">
                 {!isApiKeySet && (
                    <p className="text-yellow-400 mb-4">Vui lòng thiết lập API Key trong phần Cài đặt (biểu tượng bánh răng ở góc trên bên phải) để tiếp tục.</p>
                 )}
                <button
                    onClick={handleAnalyzeClick}
                    disabled={!dialogue.trim() || !isApiKeySet}
                    className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg shadow-purple-600/30"
                >
                    Phân Tích & Tiếp Tục (Bước 2)
                </button>
            </div>
        </div>
    );
};

export default Step1DialogueInput;