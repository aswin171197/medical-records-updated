import { HttpService } from "@nestjs/axios";
export interface ChatPayload {
    patient_id: string;
    message: string;
    conversation_id?: string;
    audio_url?: string;
    patient_context: Record<string, any>;
    type: 'text' | 'voice';
    talk_back?: boolean;
}
export declare class ChatbotService {
    private readonly httpService;
    private readonly logger;
    constructor(httpService: HttpService);
    chatWithAi(payload: ChatPayload, options?: {
        format: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            response: string;
            conversation_id: string;
            detected_language: string;
            response_language: string;
            examination_stage: string;
            follow_up_questions: any[];
            medical_insights: {};
            urgency_level: string;
            timestamp: string;
            transcribed_text: string;
            audio_id: string;
            audio_url: string;
            voice_language: string;
        };
    }>;
    private generateEMRContextualResponse;
    private generateVoiceAudio;
    private generateContextualResponse;
    private generateMedicalSummary;
    private generateLabAnalysis;
    private generateImagingAnalysis;
    private findSpecificValues;
    private generateTimelineAnalysis;
    private analyzeAbnormalValues;
    private generateHelpResponse;
    private extractSpecificTestQueries;
    private extractTestNamesFromQuery;
    private getSpecificTestResults;
    private extractResponseText;
    private formatTextPayload;
    private formatVoicePayload;
    getAudio(payload: {
        audio_id: string;
    }): Promise<import("axios").AxiosResponse<any, {
        audio_id: string;
    }, {}>>;
    processVoiceChat(body: any, audioFile: any): Promise<{
        success: boolean;
        message: string;
        data: {
            response: string;
            conversation_id: any;
            detected_language: string;
            response_language: string;
            examination_stage: string;
            follow_up_questions: any[];
            medical_insights: {};
            urgency_level: string;
            timestamp: string;
            transcribed_text: string;
            audio_id: string;
            audio_url: string;
            voice_language: string;
        };
    }>;
    private simulateVoiceTranscription;
    startVoiceRecording(body: any): Promise<{
        success: boolean;
        message: string;
        data: {
            session_id: string;
            status: string;
            timestamp: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    stopVoiceRecording(body: any): Promise<{
        success: boolean;
        message: string;
        data: {
            session_id: any;
            status: string;
            timestamp: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    getSummary(id: string, options?: {
        format: boolean;
    }): Promise<any>;
    private summarizeChat;
    private getAiEndPoint;
    private success;
    private error;
}
