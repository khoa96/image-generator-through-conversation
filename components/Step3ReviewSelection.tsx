import React, { useState } from 'react';
import JSZip from 'jszip';
import { Scene } from '../types';
import SceneResultCard from './SceneResultCard';
import ImagePreviewModal from './ImagePreviewModal';
import { ArrowPathIcon } from './icons';

// Define the necessary types for the File System Access API for TypeScript
declare global {
    interface Window {
        showSaveFilePicker: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
    }
    interface SaveFilePickerOptions {
        suggestedName?: string;
        types?: {
            description?: string;
            accept?: Record<string, string[]>;
        }[];
    }
    interface FileSystemFileHandle {
        createWritable: (options?: { keepExistingData?: boolean }) => Promise<FileSystemWritableFileStream>;
    }
    // Fix: Corrected the type definition for FileSystemWritableFileStream to align with standard DOM libs
    interface FileSystemWritableFileStream extends WritableStream {
        write(data: FileSystemWriteChunkType): Promise<void>;
        seek(position: number): Promise<void>;
        truncate(size: number): Promise<void>;
    }
    // FIX: Removed duplicate identifier 'FileSystemWriteChunkType'. This type is already
    // available in the global scope in standard DOM library definitions.
}

interface Step3ReviewSelectionProps {
    scenes: Scene[];
    setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
    onStartOver: () => void;
    onRegenerate: (sceneId: string, additionalPrompt: string) => Promise<void>;
    imageCount: number;
}

const Step3ReviewSelection: React.FC<Step3ReviewSelectionProps> = ({ scenes, setScenes, onStartOver, onRegenerate, imageCount }) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null);

    const handleSelectImage = (sceneId: string, image: string) => {
        setScenes(scenes.map(s => s.id === sceneId ? { ...s, selectedImage: image } : s));
    };

    const handlePreview = (image: string) => {
        setPreviewImage(image);
    };

    const handleRegenerateClick = async (sceneId: string, additionalPrompt: string) => {
        setRegeneratingSceneId(sceneId);
        await onRegenerate(sceneId, additionalPrompt);
        setRegeneratingSceneId(null);
    };

    const downloadImage = (image: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = image;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const scenesToDownload = scenes.filter(s => s.selectedImage);
    
    const downloadWithLink = (blob: Blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'image_generator_scenes.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const handleDownloadAll = async () => {
        if (scenesToDownload.length === 0) return;

        const zip = new JSZip();
        scenesToDownload.forEach((scene) => {
            if (scene.selectedImage) {
                const base64Data = scene.selectedImage.split(',')[1];
                const sceneIndex = scenes.findIndex(s => s.id === scene.id);
                zip.file(`scene_${sceneIndex + 1}_selected.png`, base64Data, { base64: true });
            }
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            if (window.showSaveFilePicker) {
                 try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: 'image_generator_scenes.zip',
                        types: [{
                            description: 'ZIP File',
                            accept: { 'application/zip': ['.zip'] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(content);
                    await writable.close();
                } catch (err: any) {
                    if (err.name !== 'AbortError') {
                        console.error('Error using File System Access API, falling back.', err);
                        downloadWithLink(content);
                    }
                }
            } else {
                downloadWithLink(content);
            }
        } catch (error) {
            console.error("Failed to generate zip file", error);
        }
    };

    return (
        <div className="space-y-8">
             <h2 className="text-2xl font-bold mb-6 text-center text-purple-400">Bước 3/3: Duyệt và Lựa Chọn Ảnh Tốt Nhất</h2>
            <div className="space-y-12">
                {scenes.map((scene, index) => (
                    <SceneResultCard
                        key={scene.id}
                        scene={scene}
                        sceneNumber={index + 1}
                        onSelect={handleSelectImage}
                        onPreview={handlePreview}
                        onRegenerate={handleRegenerateClick}
                        isRegenerating={regeneratingSceneId === scene.id}
                        onDownload={downloadImage}
                        imageCount={imageCount}
                    />
                ))}
            </div>
            <div className="text-center mt-12 py-6 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    onClick={handleDownloadAll}
                    disabled={scenesToDownload.length === 0}
                    className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg shadow-green-600/30"
                >
                    Hoàn Tất & Tải Xuống Tất Cả Ảnh Đã Chọn ({scenesToDownload.length})
                </button>
                <button
                    onClick={onStartOver}
                    className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-all transform hover:scale-105 shadow-lg shadow-gray-600/30"
                >
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Tạo Mới Từ Đầu
                </button>
            </div>
            {previewImage && <ImagePreviewModal imageSrc={previewImage} onClose={() => setPreviewImage(null)} />}
        </div>
    );
};

export default Step3ReviewSelection;