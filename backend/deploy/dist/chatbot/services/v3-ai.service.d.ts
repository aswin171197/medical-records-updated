import { LiveServerMessage, Session } from '@google/genai';
export interface GeminiLiveCallbacks {
    onMessage: (message: LiveServerMessage) => void;
    onError: (error: ErrorEvent) => void;
    onClose: (event: CloseEvent) => void;
    onOpen: () => void;
}
export declare class V3AiService {
    private readonly logger;
    private readonly ai;
    constructor();
    createLiveSession(callbacks: GeminiLiveCallbacks, type: 'bot' | 'apt', opts?: any): Promise<Session>;
    private getAIConfig;
}
