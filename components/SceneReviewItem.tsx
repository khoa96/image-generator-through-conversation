import React, { useState } from 'react';
import { Scene, Character } from '../types';
import { ChevronDownIcon } from './icons';

interface SceneReviewItemProps {
    scene: Scene;
    sceneNumber: number;
    onUpdate: (scene: Scene) => void;
    characters: Character[];
}

const SceneReviewItem: React.FC<SceneReviewItemProps> = ({ scene, sceneNumber, onUpdate, characters }) => {
    const [isOpen, setIsOpen] = useState(sceneNumber === 1);

    const generatedPrompt = `Generate a 16:9 cartoon style image for the following scene.
Characters:
${characters.map(c => `- ${c.name}: ${c.description || '(Not described)'}`).join('\n')}
Scene Description: ${scene.title}
Dialogue Excerpt: "${scene.dialogue}"
Ensure the characters in the image are consistent with their descriptions and reference images.
IMPORTANT: Do not include any text, words, speech bubbles, or captions in the image. The image should be purely visual.`;

    return (
        <div className="bg-gray-700/50 rounded-lg border border-gray-600">
            <button
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="font-semibold text-lg">
                    Phân Cảnh {sceneNumber}: <span className="text-purple-300">{scene.title}</span>
                </h3>
                <ChevronDownIcon className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-600">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Title tóm tắt (có thể sửa)</label>
                            <input
                                type="text"
                                value={scene.title}
                                onChange={(e) => onUpdate({ ...scene, title: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                         <div>
                            <p className="text-sm font-medium text-gray-300 mb-1">Trích đoạn Hội thoại</p>
                            <p className="bg-gray-900 p-3 rounded-md border border-gray-600 text-gray-400 whitespace-pre-wrap">{scene.dialogue}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-300 mb-1">Prompt Gốc (Preview)</p>
                            <p className="bg-gray-900 p-3 rounded-md border border-gray-600 text-gray-400 text-sm whitespace-pre-wrap font-mono">{generatedPrompt}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SceneReviewItem;