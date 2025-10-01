export enum Step {
    DialogueInput = 1,
    SetupReview = 2,
    ReviewSelection = 3,
}

export interface Character {
    id: string;
    name: string;
    description: string;
    referenceImage: File | null;
}

export interface Scene {
    id: string;
    title: string;
    dialogue: string;
    generatedImages: (string | null)[]; // Array of base64 image strings
    selectedImage: string | null;
}
