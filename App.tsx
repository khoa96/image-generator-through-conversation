import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Character, Scene, Step, Settings } from './types';
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
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        apiKey: null,
        imageCount: 1,
    });

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('appSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings(currentSettings => ({...currentSettings, ...parsedSettings}));
            }
        } catch (e) {
            console.error("Failed to parse settings from localStorage", e);
        }
    }, []);

    const handleSaveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        localStorage.setItem('appSettings', JSON.stringify(newSettings));
        setIsSettingsModalOpen(false);
    };

    const getApiKey = useCallback(() => {
        return settings.apiKey || process.env.API_KEY;
    }, [settings.apiKey]);

    const handleAnalyzeDialogue = useCallback(async (script: string) => {
        const apiKey = getApiKey();
        if (!apiKey) {
            setError("Vui lòng thiết lập API Key trong phần Cài đặt trước khi tiếp tục.");
            return;
        }

        setDialogue(script);
        setIsLoading(true);
        setLoadingMessage('Phân tích hội thoại, vui lòng đợi...');
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey });
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
            setError('Không thể phân tích hội thoại. Vui lòng kiểm tra lại định dạng và API Key.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [getApiKey]);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };
    
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const getErrorMessage = (e: any): { message: string, shouldStop: boolean } => {
        let message = 'Đã xảy ra lỗi không mong muốn.';
        let shouldStop = false;

        const errorString = typeof e?.message === 'string' ? e.message : JSON.stringify(e);
        
        if (errorString.includes('quota') || errorString.includes('daily limit')) {
            message = 'Bạn đã đạt đến giới hạn sử dụng API hàng ngày. Vui lòng thử lại sau 24 giờ hoặc sử dụng API Key khác. Lưu ý: Nếu bạn đang sử dụng một API key mẫu từ internet, nó có thể đã bị sử dụng hết. Vui lòng tạo và sử dụng API key của riêng bạn từ Google AI Studio.';
            shouldStop = true;
        } else if (errorString.includes('RESOURCE_EXHAUSTED')) {
            message = 'Bạn đã vượt quá giới hạn API (yêu cầu/phút). Quá trình tạo ảnh đã bị dừng. Vui lòng đợi một lát rồi thử lại.';
            shouldStop = true;
        } else if (errorString.includes('API key not valid')) {
            message = 'API Key không hợp lệ. Vui lòng kiểm tra lại trong phần Cài đặt.';
            shouldStop = true;
        }

        return { message, shouldStop };
    };

    const handleGenerateImages = useCallback(async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            setError("Vui lòng thiết lập API Key trong phần Cài đặt trước khi tạo ảnh.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const ai = new GoogleGenAI({ apiKey });
        const scenesWithImages: Scene[] = [];
        let processShouldStop = false;

        for(let i = 0; i < scenes.length; i++) {
            if (processShouldStop) break;
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

            for(let j = 0; j < settings.imageCount; j++) {
                if (i > 0 || j > 0) {
                    await delay(1200);
                }

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
                        generatedImagesForScene.push('');
                    }
                } catch(e: any) {
                    console.error(`Error generating image ${j+1} for scene ${i+1}:`, e);
                    const { message, shouldStop } = getErrorMessage(e);
                    setError(message);
                    processShouldStop = shouldStop;
                    generatedImagesForScene.push('');
                    if (processShouldStop) break;
                }
            }
            scenesWithImages.push({ ...scene, generatedImages: generatedImagesForScene });
        }

        setScenes(scenesWithImages);
        setCurrentStep(Step.ReviewSelection);
        setIsLoading(false);
        setLoadingMessage('');

    }, [characters, scenes, settings.imageCount, getApiKey]);

     const handleRegenerateScene = useCallback(async (sceneId: string, additionalPrompt: string) => {
        const apiKey = getApiKey();
        if (!apiKey) {
            setError("Vui lòng thiết lập API Key trong phần Cài đặt trước khi tạo ảnh.");
            return;
        }

        const sceneToRegenerate = scenes.find(s => s.id === sceneId);
        if (!sceneToRegenerate) return;

        const generatedImagesForScene: string[] = [];
        const ai = new GoogleGenAI({ apiKey });
        
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

        for (let j = 0; j < settings.imageCount; j++) {
            if (j > 0) {
                await delay(1200);
            }
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
            } catch (e: any) {
                console.error(e);
                const { message } = getErrorMessage(e);
                setError(message);
                generatedImagesForScene.push('');
            }
        }

        setScenes(scenes.map(s => s.id === sceneId ? { ...s, generatedImages: generatedImagesForScene, selectedImage: null } : s));
    }, [scenes, characters, settings.imageCount, getApiKey]);

    const handleStartOver = () => {
        setCurrentStep(Step.DialogueInput);
        setDialogue('');
        setCharacters([]);
        setScenes([]);
        setError(null);
        setIsLoading(false);
        setLoadingMessage('');
    };
    
    const renderCurrentStep = () => {
        const isApiKeySet = !!getApiKey();
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
                    imageCount={settings.imageCount}
                 />;
            default:
                return <Step1DialogueInput onAnalyze={handleAnalyzeDialogue} initialDialogue={dialogue} isApiKeySet={isApiKeySet} />;
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
                onSave={handleSaveSettings}
                currentSettings={settings}
            />
        </div>
    );
};

export default App;