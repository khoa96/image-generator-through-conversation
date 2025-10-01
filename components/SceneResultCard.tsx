import React, { useState } from 'react';
import { Scene } from '../types';
import { DownloadIcon, EyeIcon, RefreshIcon, CheckCircleIcon } from './icons';
import Spinner from './Spinner';

interface SceneResultCardProps {
    scene: Scene;
    sceneNumber: number;
    onSelect: (sceneId: string, image: string) => void;
    onPreview: (image: string) => void;
    onRegenerate: (sceneId: string, additionalPrompt: string) => void;
    isRegenerating: boolean;
    onDownload: (image: string, fileName: string) => void;
}

const ImageColumn: React.FC<{
    label: string;
    image: string | null;
    isSelected: boolean;
    onSelect: () => void;
    onPreview: () => void;
    onDownload: () => void;
}> = ({ label, image, isSelected, onSelect, onPreview, onDownload }) => {
    if (!image) {
        return (
            <div className="flex flex-col items-center justify-center bg-gray-900 aspect-video rounded-lg border-2 border-dashed border-gray-700">
                <p className="text-gray-500">Tạo ảnh thất bại</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-3">
            <div className="relative group aspect-video">
                <img src={image} alt={`Ảnh ${label}`} className="w-full h-full object-cover rounded-lg" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isSelected && <CheckCircleIcon className="w-16 h-16 text-green-400 absolute top-2 right-2" />}
                </div>
            </div>
            <div className="flex justify-center space-x-2">
                <button onClick={onSelect} className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors w-full ${isSelected ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {isSelected ? 'Đã Chọn' : `Chọn Ảnh ${label}`}
                </button>
                <button onClick={onPreview} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md"><EyeIcon className="w-5 h-5" /></button>
                <button onClick={onDownload} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md"><DownloadIcon className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

const SceneResultCard: React.FC<SceneResultCardProps> = ({ scene, sceneNumber, onSelect, onPreview, onRegenerate, isRegenerating, onDownload }) => {
    const [additionalPrompt, setAdditionalPrompt] = useState('');
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-purple-300">Phân Cảnh {sceneNumber}: {scene.title}</h3>
                <p className="text-gray-400 text-sm italic mt-1">Trích đoạn: "{scene.dialogue}"</p>
            </div>

            {isRegenerating ? (
                <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
                    <Spinner />
                    <p className="ml-4">Đang tạo lại ảnh mới...</p>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-6">
                    <ImageColumn
                        label="A"
                        image={scene.generatedImages[0]}
                        isSelected={scene.selectedImage === scene.generatedImages[0]}
                        onSelect={() => scene.generatedImages[0] && onSelect(scene.id, scene.generatedImages[0])}
                        onPreview={() => scene.generatedImages[0] && onPreview(scene.generatedImages[0])}
                        onDownload={() => scene.generatedImages[0] && onDownload(scene.generatedImages[0], `scene_${sceneNumber}_A.png`)}
                    />
                    <ImageColumn
                        label="B"
                        image={scene.generatedImages[1]}
                        isSelected={scene.selectedImage === scene.generatedImages[1]}
                        onSelect={() => scene.generatedImages[1] && onSelect(scene.id, scene.generatedImages[1])}
                        onPreview={() => scene.generatedImages[1] && onPreview(scene.generatedImages[1])}
                        onDownload={() => scene.generatedImages[1] && onDownload(scene.generatedImages[1], `scene_${sceneNumber}_B.png`)}
                    />
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-700/50 flex flex-col items-center">
                <div className="w-full max-w-2xl text-center">
                    <label htmlFor={`additional-prompt-${scene.id}`} className="block text-sm font-medium text-gray-300 mb-2">
                        Tinh chỉnh ảnh với mô tả chi tiết hơn (tùy chọn)
                    </label>
                    <textarea
                        id={`additional-prompt-${scene.id}`}
                        value={additionalPrompt}
                        onChange={(e) => setAdditionalPrompt(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500 resize-y text-sm placeholder-gray-500"
                        placeholder="Ví dụ: 'thay đổi bầu trời thành hoàng hôn', 'thêm một con mèo vào cảnh'..."
                        disabled={isRegenerating}
                    />
                    <button
                        onClick={() => onRegenerate(scene.id, additionalPrompt)}
                        disabled={isRegenerating}
                        className="inline-flex items-center mt-4 px-8 py-3 border border-transparent font-semibold rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                    >
                        <RefreshIcon className={`w-5 h-5 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                        Tạo Lại 2 Ảnh Mới
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SceneResultCard;