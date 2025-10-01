import React from 'react';
import { Character, Scene } from '../types';
import CharacterSetupCard from './CharacterSetupCard';
import SceneReviewItem from './SceneReviewItem';

interface Step2SetupReviewProps {
    characters: Character[];
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
    scenes: Scene[];
    setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
    onGenerate: () => void;
}

const Step2SetupReview: React.FC<Step2SetupReviewProps> = ({ characters, setCharacters, scenes, setScenes, onGenerate }) => {
    
    const handleCharacterUpdate = (updatedCharacter: Character) => {
        setCharacters(characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c));
    };

    const handleSceneUpdate = (updatedScene: Scene) => {
        setScenes(scenes.map(s => s.id === updatedScene.id ? updatedScene : s));
    };

    const isReadyForGeneration = characters.every(c => c.referenceImage);

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Character Setup Column */}
                <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow-xl p-6">
                    <h2 className="text-2xl font-bold mb-4 text-purple-400">Thiết Lập {characters.length} Nhân Vật</h2>
                    <div className="space-y-6">
                        {characters.map((character) => {
                            const isComplete = !!character.referenceImage;
                            return (
                                <CharacterSetupCard 
                                    key={character.id} 
                                    character={character} 
                                    onUpdate={handleCharacterUpdate}
                                    isComplete={isComplete}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Scene Review Column */}
                <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-xl p-6">
                    <h2 className="text-2xl font-bold mb-4 text-purple-400">Kiểm Tra {scenes.length} Phân Cảnh Được Phân Tích</h2>
                    <div className="space-y-4">
                        {scenes.map((scene, index) => (
                            <SceneReviewItem 
                                key={scene.id} 
                                scene={scene}
                                sceneNumber={index + 1}
                                onUpdate={handleSceneUpdate}
                                characters={characters}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="text-center mt-8">
                 {!isReadyForGeneration && (
                    <p className="text-yellow-400 mb-4">Vui lòng cung cấp ảnh tham chiếu cho tất cả các nhân vật để tiếp tục.</p>
                )}
                <button
                    onClick={onGenerate}
                    disabled={!isReadyForGeneration}
                    className="px-10 py-4 bg-purple-600 text-white font-bold text-lg rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg shadow-purple-600/30"
                >
                    Tạo Ảnh Kết Quả (Bước 3)
                </button>
            </div>
        </div>
    );
};

export default Step2SetupReview;