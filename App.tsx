import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Character, Scene, Step } from './types';
import StepIndicator from './components/StepIndicator';
import Step1DialogueInput from './components/Step1DialogueInput';
import Step2SetupReview from './components/Step2SetupReview';
import Step3ReviewSelection from './components/Step3ReviewSelection';
import SettingsModal from './components/SettingsModal';
import { CogIcon } from './components/icons';

const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<Step>(Step.DialogueInput);
    const [dialogue, setDialogue] = useState<string>('');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    
    const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini_api_key'));
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const isApiKeySet = !!apiKey || !!process.env.API_KEY;

    useEffect(() => {
        if (!isApiKeySet) {
            setError("Vui lòng thiết lập API Key của bạn trong phần Cài đặt (biểu tượng bánh răng ở góc trên bên phải) để sử dụng ứng dụng.");
        } else {
            setError(null);
        }
    }, [isApiKeySet]);

    const getGenAI = () => {
        const keyToUse = apiKey || process.env.API_KEY;
        if (!keyToUse) {
            throw new Error("API Key not found.");
        }
        return new GoogleGenAI({ apiKey: keyToUse });
    }

    const handleAnalyzeDialogue = useCallback(async (script: string) => {
        if (!isApiKeySet) return;
        setDialogue(script);
        setIsLoading(true);
        setLoadingMessage('Phân tích hội thoại, vui lòng đợi...');
        setError(null);

        try {
            const ai = getGenAI();
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Your task is to analyze a dialogue script. First, identify all unique character names (written in uppercase). Then, break the script down into individual scenes, with each scene corresponding to a single line of dialogue spoken by a character.

For each line of dialogue:
- Create a new scene.
- Provide a concise title that describes the action or content of that specific line (e.g., "John greets Jane," "Jane suggests a walk").
- Include the exact, single line of dialogue for that scene.

Respond ONLY with a JSON object that follows the provided schema. Do not add any extra text or explanations.

Example Dialogue:
JOHN: Chào Jane, hôm nay thời tiết đẹp quá!
JANE: Vâng, tôi cũng thấy vậy. Anh có muốn đi dạo không?
JOHN: Một ý hay! Chúng ta đi công viên nhé.
JANE: Tuyệt vời!

Example Detailed JSON Output:
{
    "characters": ["JOHN", "JANE"],
    "scenes": [
        { "title": "John greets Jane and comments on the weather", "dialogue": "JOHN: Chào Jane, hôm nay thời tiết đẹp quá!" },
        { "title": "Jane agrees and suggests a walk", "dialogue": "JANE: Vâng, tôi cũng thấy vậy. Anh có muốn đi dạo không?" },
        { "title": "John agrees and suggests the park", "dialogue": "JOHN: Một ý hay! Chúng ta đi công viên nhé." },
        { "title": "Jane agrees enthusiastically", "dialogue": "JANE: Tuyệt vời!" }
    ]
}

Now, analyze this script:
${script}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            characters: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            scenes: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        dialogue: { type: Type.STRING }
                                    },
                                    required: ['title', 'dialogue']
                                }
                            }
                        },
                        required: ['characters', 'scenes']
                    }
                }
            });

            const jsonResponse = JSON.parse(response.text);
            
            const newCharacters: Character[] = jsonResponse.characters.map((name: string, index: number) => ({
                id: `char-${index}`,
                name,
                description: '',
                referenceImage: null,
            }));

            const newScenes: Scene[] = jsonResponse.scenes.map((scene: any, index: number) => ({
                id: `scene-${index}`,
                title: scene.title,
                dialogue: scene.dialogue,
                generatedImages: [],
                selectedImage: null,
            }));

            setCharacters(newCharacters);
            setScenes(newScenes);
            setCurrentStep(Step.SetupReview);

        } catch (e) {
            console.error(e);
            setError('Không thể phân tích hội thoại. Vui lòng kiểm tra lại định dạng hoặc API Key và thử lại.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [isApiKeySet]);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };
    
    const handleGenerateImages = useCallback(async () => {
        if (!isApiKeySet) return;
        setIsLoading(true);
        setError(null);
        
        const ai = getGenAI();
        const scenesWithImages: Scene[] = [];

        for(let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            setLoadingMessage(`Đang tạo ảnh cho phân cảnh ${i + 1}/${scenes.length}...`);
            const generatedImagesForScene: string[] = [];
            
            const promptText = `Generate a 16:9 cartoon style image for the following scene.
            Characters:
            ${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}
            Scene Description: ${scene.title}
            Dialogue Excerpt: "${scene.dialogue}"
            Ensure the characters in the image are consistent with their descriptions and reference images.
            IMPORTANT: Do not include any text, words, speech bubbles, or captions in the image. The image should be purely visual.`;

            const imageParts = await Promise.all(
                characters
                    .filter(c => c.referenceImage)
                    .map(async c => ({
                        inlineData: {
                            data: await fileToBase64(c.referenceImage!),
                            mimeType: c.referenceImage!.type
                        }
                    }))
            );

            for(let j = 0; j < 2; j++) { // Generate 2 images
                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image-preview',
                        contents: { parts: [{ text: promptText }, ...imageParts] },
                        config: {
                            responseModalities: [Modality.IMAGE, Modality.TEXT],
                        },
                    });

                    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
                    if (imagePart?.inlineData) {
                        const base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                        generatedImagesForScene.push(base64Image);
                    } else {
                        generatedImagesForScene.push(''); // placeholder for failed image
                    }
                } catch(e) {
                    console.error(`Error generating image ${j+1} for scene ${i+1}:`, e);
                    setError(`Lỗi khi tạo ảnh ${j+1} cho phân cảnh ${i+1}.`);
                    generatedImagesForScene.push('');
                }
            }
            scenesWithImages.push({ ...scene, generatedImages: generatedImagesForScene });
        }

        setScenes(scenesWithImages);
        setCurrentStep(Step.ReviewSelection);
        setIsLoading(false);
        setLoadingMessage('');

    }, [characters, scenes, isApiKeySet]);

     const handleRegenerateScene = useCallback(async (sceneId: string, additionalPrompt: string) => {
        const sceneToRegenerate = scenes.find(s => s.id === sceneId);
        if (!sceneToRegenerate || !isApiKeySet) return;

        const generatedImagesForScene: string[] = [];
        const ai = getGenAI();
        
        let promptText = `Generate a 16:9 cartoon style image for the following scene.
            Characters:
            ${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}
            Scene Description: ${sceneToRegenerate.title}
            Dialogue Excerpt: "${sceneToRegenerate.dialogue}"`;

        if (additionalPrompt.trim()) {
            promptText += `\nAdditional Instructions: ${additionalPrompt.trim()}`;
        }
        
        promptText += `\nEnsure the characters in the image are consistent with their descriptions and reference images.
            IMPORTANT: Do not include any text, words, speech bubbles, or captions in the image. The image should be purely visual.`;

        const imageParts = await Promise.all(
            characters
                .filter(c => c.referenceImage)
                .map(async c => ({
                    inlineData: {
                        data: await fileToBase64(c.referenceImage!),
                        mimeType: c.referenceImage!.type
                    }
                }))
        );

        for (let j = 0; j < 2; j++) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image-preview',
                    contents: { parts: [{ text: promptText }, ...imageParts] },
                    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
                });
                const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
                if (imagePart?.inlineData) {
                    generatedImagesForScene.push(`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`);
                } else {
                    generatedImagesForScene.push('');
                }
            } catch (e) {
                console.error(e);
                setError(`Lỗi khi tạo lại ảnh cho phân cảnh.`);
                generatedImagesForScene.push('');
            }
        }

        setScenes(scenes.map(s => s.id === sceneId ? { ...s, generatedImages: generatedImagesForScene, selectedImage: null } : s));
    }, [scenes, characters, isApiKeySet]);

    const handleStartOver = () => {
        setCurrentStep(Step.DialogueInput);
        setDialogue('');
        setCharacters([]);
        setScenes([]);
        if (!isApiKeySet) {
             setError("Vui lòng thiết lập API Key của bạn trong phần Cài đặt (biểu tượng bánh răng ở góc trên bên phải) để sử dụng ứng dụng.");
        } else {
            setError(null);
        }
        setIsLoading(false);
        setLoadingMessage('');
    };

    const handleSaveApiKey = (newKey: string) => {
        if (newKey) {
            setApiKey(newKey);
            localStorage.setItem('gemini_api_key', newKey);
            setError(null); // Clear the error message once the key is set
        } else {
            setApiKey(null);
            localStorage.removeItem('gemini_api_key');
        }
        setIsSettingsModalOpen(false);
    }
    
    const renderCurrentStep = () => {
        switch (currentStep) {
            case Step.DialogueInput:
                return <Step1DialogueInput onAnalyze={handleAnalyzeDialogue} initialDialogue={dialogue} isApiKeySet={isApiKeySet} />;
            case Step.SetupReview:
                return <Step2SetupReview 
                    characters={characters} 
                    setCharacters={setCharacters}
                    scenes={scenes}
                    setScenes={setScenes}
                    onGenerate={handleGenerateImages}
                />;
            case Step.ReviewSelection:
                 return <Step3ReviewSelection 
                    scenes={scenes} 
                    setScenes={setScenes}
                    onStartOver={handleStartOver}
                    onRegenerate={handleRegenerateScene}
                 />;
            default:
                return <Step1DialogueInput onAnalyze={handleAnalyzeDialogue} initialDialogue={dialogue} isApiKeySet={isApiKeySet}/>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <div className="container mx-auto px-4 py-8">
                <header className="text-center mb-10 relative">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        Image Generator through Conversation
                    </h1>
                    <p className="text-gray-400 mt-2">Tạo ảnh nhân vật hoạt hình đồng nhất từ hội thoại</p>
                    <button 
                        onClick={() => setIsSettingsModalOpen(true)} 
                        className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Settings"
                    >
                        <CogIcon className="w-8 h-8"/>
                    </button>
                </header>

                <StepIndicator currentStep={currentStep} />
                
                {isLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-50">
                        <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-700 rounded-full animate-spin"></div>
                        <p className="mt-4 text-lg">{loadingMessage}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative my-4" role="alert">
                        <strong className="font-bold">Lỗi! </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <main className="mt-8">
                    {renderCurrentStep()}
                </main>
            </div>
            <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onSave={handleSaveApiKey}
                currentApiKey={apiKey}
            />
        </div>
    );
};

export default App;