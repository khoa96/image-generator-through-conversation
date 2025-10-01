import React, { useState, useCallback } from 'react';
import { Character } from '../types';
import { UploadIcon, CheckCircleIcon } from './icons';

interface CharacterSetupCardProps {
    character: Character;
    onUpdate: (character: Character) => void;
    isComplete: boolean;
}

const CharacterSetupCard: React.FC<CharacterSetupCardProps> = ({ character, onUpdate, isComplete }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('Ảnh không được vượt quá 2MB.');
                return;
            }
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            onUpdate({ ...character, referenceImage: file });
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('Ảnh không được vượt quá 2MB.');
                return;
            }
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            onUpdate({ ...character, referenceImage: file });
        }
    }, [character, onUpdate]);

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className={`bg-gray-700/50 rounded-lg p-4 border ${isComplete ? 'border-green-500' : 'border-gray-600'} transition-colors`}>
            <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-300">Tên Nhân Vật</label>
                    {isComplete && <span className="flex items-center text-xs text-green-400"><CheckCircleIcon className="w-4 h-4 mr-1" /> Hoàn thành</span>}
                </div>
                <input
                    type="text"
                    value={character.name}
                    onChange={(e) => onUpdate({ ...character, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Ảnh Tham Chiếu</label>
                <label 
                    htmlFor={`upload-${character.id}`} 
                    className="relative flex justify-center items-center w-full h-32 px-4 transition bg-gray-900 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-purple-500 focus:outline-none"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    {preview ? (
                        <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-md" />
                    ) : (
                        <span className="flex flex-col items-center space-x-2">
                           <UploadIcon className="w-8 h-8 text-gray-500"/>
                            <span className="font-medium text-gray-500">
                                Kéo & thả hoặc <span className="text-purple-400">chọn ảnh</span>
                            </span>
                             <span className="text-xs text-gray-600">Tối đa 2MB</span>
                        </span>
                    )}
                    <input id={`upload-${character.id}`} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Mô tả ngoại hình (tùy chọn)</label>
                <textarea
                    rows={3}
                    value={character.description}
                    onChange={(e) => onUpdate({ ...character, description: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    placeholder={`Ví dụ: ${character.name.toLowerCase().includes('john') ? 'Nam, 30 tuổi, tóc nâu ngắn, áo khoác da màu xanh rêu' : 'Nữ, 28 tuổi, tóc vàng dài, mặc váy hoa'}`}
                />
            </div>
        </div>
    );
};

export default CharacterSetupCard;