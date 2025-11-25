import { Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { jsonToKeyValueString } from "../../shared/utils/utils.function";

import { GEMINI_PROMPT } from '../_ai-prompts/gemini-prompt.const';

export interface ChatPayload {
    patient_id: string;
    message: string;
    conversation_id?: string;
    audio_url?: string;
    patient_context: Record<string, any>;
    type: 'text' | 'voice';
    talk_back?: boolean;
}

interface AiChatResponse {
  response: string;
  conversation_id: string;
  detected_language: string;
  response_language: string;
  examination_stage: string;
  follow_up_questions: string[];
  medical_insights: Record<string, any>;
  urgency_level: string;
  timestamp: string;
  transcribed_text: string;
  audio_id: string;
  audio_url: string;
  voice_language: string;
}

@Injectable()
export class ChatbotService {

    //Setup logger
    private readonly logger = new Logger(ChatbotService.name);

    constructor(
        private readonly httpService: HttpService,
    ) {}

    async chatWithAi(payload: ChatPayload, options = { format: true }) {
        try {
            // Use the integrated EMR AI Bot system - no external API calls needed
            const contextualResponse = this.generateEMRContextualResponse(payload);

            return {
                success: true,
                message: "EMR AI Bot response generated",
                data: {
                    response: contextualResponse,
                    conversation_id: payload.conversation_id,
                    detected_language: 'en',
                    response_language: 'en',
                    examination_stage: 'general',
                    follow_up_questions: [],
                    medical_insights: {},
                    urgency_level: 'normal',
                    timestamp: new Date().toISOString(),
                    transcribed_text: payload.type === 'voice' ? payload.message : '',
                    audio_id: '',
                    audio_url: '',
                    voice_language: 'en'
                }
            };
        } catch (error) {
            this.logger.error('EMR AI Bot Error:', error);

            // Provide a fallback response
            const fallbackResponse = this.generateEMRContextualResponse(payload);

            return {
                success: true,
                message: "Fallback response provided",
                data: {
                    response: fallbackResponse,
                    conversation_id: payload.conversation_id,
                    detected_language: 'en',
                    response_language: 'en',
                    examination_stage: 'general',
                    follow_up_questions: [],
                    medical_insights: {},
                    urgency_level: 'normal',
                    timestamp: new Date().toISOString(),
                    transcribed_text: '',
                    audio_id: '',
                    audio_url: '',
                    voice_language: 'en'
                }
            };
        }
    }

    private generateEMRContextualResponse(payload: ChatPayload): string {
        const message = payload.message?.toLowerCase() || '';
        const medicalRecords = payload.patient_context?.medicalRecords || [];

        // Skip processing if this looks like a system/bot response
        if (message.includes("i'm your ai medical assistant") || message.includes("please upload some medical documents")) {
            return "";
        }

        // Skip processing if this is a voice input that was already processed
        if (message.includes("Voice input processed")) {
            return "";
        }

        // Use EMR AI Bot prompts for professional healthcare responses following the BOT_PROMPT guidelines
        if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('good morning') || message.includes('good afternoon')) {
            if (medicalRecords.length > 0) {
                return `Hello! I can see you have ${medicalRecords.length} medical records available. I can help you analyze your test results, check lab values, review imaging reports, or answer questions about your health data. What would you like to know?`;
            } else {
                return "Hello! I'm your AI medical assistant. I can help you with questions about your medical records and health data once you upload some documents. How can I assist you today?";
            }
        }

        if (message.includes('thank') || message.includes('thanks')) {
            return "You're welcome! Remember, I'm here to help with questions about your medical records, but always consult with your healthcare provider for medical advice and interpretation.";
        }

        // Follow EMR AI Bot conversation flow - collect chief complaint first
        if (message.includes('what') && (message.includes('wrong') || message.includes('problem') || message.includes('concern') || message.includes('issue'))) {
            return "I'd be happy to help you understand your medical records. To provide the most accurate assistance, could you please tell me your main concern or symptoms today? This will help me focus on the most relevant information from your records.";
        }

        // Age and gender collection (demographics)
        if (message.includes('age') || message.includes('old') || message.includes('gender') || message.includes('male') || message.includes('female')) {
            return "Thank you for providing that information. Now, to better assist you, what's your main concern today? Are you experiencing any specific symptoms or do you have questions about your recent test results?";
        }

        // Check for specific medical queries and provide detailed responses
        if (message.includes('summary') || message.includes('overview') || message.includes('what are my') || message.includes('recent test') || message.includes('my records')) {
            return this.generateMedicalSummary(medicalRecords);
        }

        if (message.includes('lab') || message.includes('test') || message.includes('blood') || message.includes('investigation') || message.includes('cbc') || message.includes('hemoglobin') || message.includes('creatinine') || message.includes('glucose')) {
            return this.generateLabAnalysis(medicalRecords, message);
        }

        if (message.includes('x-ray') || message.includes('ct') || message.includes('mri') || message.includes('ultrasound') || message.includes('scan') || message.includes('imaging') || message.includes('radiology')) {
            return this.generateImagingAnalysis(medicalRecords);
        }

        if (message.includes('what is my') || message.includes('what was my') || message.includes('check my') || message.includes('my level') || message.includes('my value')) {
            return this.findSpecificValues(medicalRecords, message);
        }

        if (message.includes('when') || message.includes('date') || message.includes('latest') || message.includes('recent') || message.includes('last')) {
            return this.generateTimelineAnalysis(medicalRecords);
        }

        if (message.includes('normal') || message.includes('abnormal') || message.includes('high') || message.includes('low') || message.includes('flag') || message.includes('status')) {
            return this.analyzeAbnormalValues(medicalRecords);
        }

        if (message.includes('help') || message.includes('what can you') || message.includes('how') || message.includes('assist')) {
            return this.generateHelpResponse(medicalRecords);
        }

        // Handle specific user queries following EMR AI Bot conversation flow
        if (message.includes('appointment') || message.includes('schedule') || message.includes('doctor')) {
            return "I'd be happy to help you with appointment scheduling. To get started, could you please tell me your name, age, and gender? This will help me provide the most appropriate assistance.";
        }

        // Follow EMR AI Bot workflow - collect demographics first
        if (message.includes('my name is') || message.includes('i am') || message.includes('i\'m')) {
            return "Thank you for providing that information. Now, to help you schedule an appointment, could you please tell me which insurance company you're covered under? This will help me find the most suitable location for your visit.";
        }

        // Insurance collection
        if (message.includes('insurance') || message.includes('covered by') || message.includes('plan')) {
            return "Thank you for letting me know about your insurance. Based on your coverage, I can schedule your appointment at one of our convenient locations. Here are the earliest available appointment times:\n\n1. Tomorrow at 10:00 AM\n2. Tomorrow at 2:00 PM\n3. Day after tomorrow at 9:00 AM\n\nWhich time works best for you?";
        }

        // Appointment time selection
        if (message.includes('1') || message.includes('2') || message.includes('3') || message.includes('first') || message.includes('second') || message.includes('third')) {
            return "Perfect! Your appointment has been confirmed. You'll receive a confirmation message with all the details. Please arrive 15 minutes early for check-in and bring your insurance card and ID. Is there anything else I can help you with regarding your medical records?";
        }

        if (message.includes('medication') || message.includes('medicine') || message.includes('prescription') || message.includes('drug')) {
            return "I can help you review medication information from your medical records. However, I cannot prescribe medications or change dosages. For medication-related questions, please consult your prescribing physician. Would you like me to show you medication information from your records?";
        }

        if (message.includes('symptom') || message.includes('pain') || message.includes('feeling')) {
            return "I understand you're experiencing some symptoms. While I can help you understand your medical records and test results, I'm not able to provide medical diagnoses or treatment recommendations. Please consult with your healthcare provider for proper evaluation of your symptoms. Can I help you review any relevant test results or medical history from your records?";
        }

        // Default response for unrecognized queries
        if (medicalRecords.length > 0) {
            const totalTests = medicalRecords.reduce((sum, record) => sum + (record.extractedData?.investigations?.length || 0), 0);
            const totalImaging = medicalRecords.reduce((sum, record) => sum + (record.extractedData?.imaging_radiology_reports?.length || 0), 0);

            return `I can see you have ${medicalRecords.length} medical records with ${totalTests} lab tests and ${totalImaging} imaging reports. I can help you with:

• Getting summaries of your test results
• Checking specific lab values (like hemoglobin, creatinine, glucose)
• Reviewing your imaging reports
• Analyzing trends over time
• Identifying any abnormal values

What specific information would you like to know about your medical records?`;
        }

        // For voice responses, always provide a meaningful response
        if (payload.type === 'voice') {
            return "I've received your voice message. I'm here to help you with your medical records. You can ask me about your test results, lab values, imaging reports, or any questions about your health data. What would you like to know?";
        }

        // Return empty string for unrecognized queries
        return "";
    }

    private generateVoiceAudio(text: string): string {
        // In a real implementation, this would integrate with a TTS service
        // For now, we'll return a placeholder base64 encoded audio
        // This simulates a short audio response
        const placeholderAudio = Buffer.from('RIFF\x24\x08\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x08\x00\x00').toString('base64');
        return placeholderAudio;
    }

    private generateContextualResponse(payload: ChatPayload): string {
        const message = payload.message?.toLowerCase() || '';
        const medicalRecords = payload.patient_context?.medicalRecords || [];
        const currentRecord = payload.patient_context?.currentRecord;

        // Greeting responses
        if (message.includes('hi') || message.includes('hello') || message.includes('hey') || message.includes('good morning') || message.includes('good afternoon')) {
            if (medicalRecords.length > 0) {
                return `Hello! I'm your AI medical assistant. I can see you have ${medicalRecords.length} medical records in your profile. I can help you understand your test results, check lab values, review imaging reports, or answer questions about your medical data. What would you like to know?`;
            } else {
                return "Hello! I'm your AI medical assistant. I can help you with questions about your medical records and health data once you upload some documents. How can I assist you today?";
            }
        }

        // Thanks responses
        if (message.includes('thank') || message.includes('thanks')) {
            return "You're welcome! Remember, I'm here to help with questions about your medical records, but always consult with your healthcare provider for medical advice and interpretation.";
        }

        // Summary requests
        if (message.includes('summary') || message.includes('overview') || message.includes('what are my') || message.includes('recent test') || message.includes('my records')) {
            return this.generateMedicalSummary(medicalRecords);
        }

        // Lab test related queries
        if (message.includes('lab') || message.includes('test') || message.includes('blood') || message.includes('investigation') || message.includes('cbc') || message.includes('hemoglobin') || message.includes('creatinine') || message.includes('glucose')) {
            return this.generateLabAnalysis(medicalRecords, message);
        }

        // Imaging related queries
        if (message.includes('x-ray') || message.includes('ct') || message.includes('mri') || message.includes('ultrasound') || message.includes('scan') || message.includes('imaging') || message.includes('radiology')) {
            return this.generateImagingAnalysis(medicalRecords);
        }

        // Specific value queries
        if (message.includes('what is my') || message.includes('what was my') || message.includes('check my') || message.includes('my level') || message.includes('my value')) {
            return this.findSpecificValues(medicalRecords, message);
        }

        // Date related queries
        if (message.includes('when') || message.includes('date') || message.includes('latest') || message.includes('recent') || message.includes('last')) {
            return this.generateTimelineAnalysis(medicalRecords);
        }

        // Normal/abnormal queries
        if (message.includes('normal') || message.includes('abnormal') || message.includes('high') || message.includes('low') || message.includes('flag') || message.includes('status')) {
            return this.analyzeAbnormalValues(medicalRecords);
        }

        // Help queries
        if (message.includes('help') || message.includes('what can you') || message.includes('how') || message.includes('assist')) {
            return this.generateHelpResponse(medicalRecords);
        }

        // Default response based on available data
        if (medicalRecords.length > 0) {
            const totalTests = medicalRecords.reduce((sum, record) => sum + (record.extractedData?.investigations?.length || 0), 0);
            const totalImaging = medicalRecords.reduce((sum, record) => sum + (record.extractedData?.imaging_radiology_reports?.length || 0), 0);

            return `I can see you have ${medicalRecords.length} medical records with ${totalTests} lab tests and ${totalImaging} imaging reports. I can help you with:

• Getting summaries of your test results
• Checking specific lab values (like hemoglobin, creatinine, glucose)
• Reviewing your imaging reports
• Analyzing trends over time
• Identifying any abnormal values

What specific information would you like to know about your medical records?`;
        }

        return "";
    }

    private generateMedicalSummary(records: any[]): string {
        if (records.length === 0) {
            return "You don't have any medical records uploaded yet. Please upload some medical documents so I can provide you with a summary.";
        }

        let summary = "📊 **Medical Records Summary**\n\n";
        summary += `You have ${records.length} medical record(s) in your profile:\n\n`;

        records.forEach((record, index) => {
            summary += `${index + 1}. **${record.title}** (${record.date})\n`;

            const investigations = record.extractedData?.investigations || [];
            const imaging = record.extractedData?.imaging_radiology_reports || [];

            if (investigations.length > 0) {
                summary += `   🔬 ${investigations.length} laboratory test(s)\n`;
            }
            if (imaging.length > 0) {
                summary += `   📷 ${imaging.length} imaging report(s)\n`;
            }
            if (record.extractedData?.other_clinical_data) {
                summary += `   📝 Clinical notes available\n`;
            }
            summary += "\n";
        });

        summary += "**Important:** This is a summary of your records. Please consult with your healthcare provider for interpretation and medical advice.";

        return summary;
    }

    private generateLabAnalysis(records: any[], query: string): string {
        const allInvestigations = records.flatMap(record =>
            (record.extractedData?.investigations || []).map(inv => ({
                ...inv,
                recordTitle: record.title,
                recordDate: record.date
            }))
        );

        if (allInvestigations.length === 0) {
            return "I don't see any laboratory tests in your medical records. Please upload lab reports so I can analyze your test results.";
        }

        // Check for specific test queries
        const specificTests = this.extractSpecificTestQueries(query);
        if (specificTests.length > 0) {
            return this.getSpecificTestResults(allInvestigations, specificTests);
        }

        // General lab analysis
        let analysis = "🔬 **Laboratory Test Analysis**\n\n";
        analysis += `Found ${allInvestigations.length} test results across your records:\n\n`;

        // Group by status
        const normal = allInvestigations.filter(inv => inv.flag === 'Normal' || inv.flag === 'N');
        const high = allInvestigations.filter(inv => inv.flag === 'High' || inv.flag === 'H');
        const low = allInvestigations.filter(inv => inv.flag === 'Low' || inv.flag === 'L');

        analysis += `✅ Normal results: ${normal.length}\n`;
        analysis += `⚠️ High results: ${high.length}\n`;
        analysis += `⚠️ Low results: ${low.length}\n\n`;

        if (high.length > 0) {
            analysis += "**Tests with High values:**\n";
            high.slice(0, 5).forEach(test => {
                analysis += `• ${test.investigation_name}: ${test.result} ${test.unit} (${test.recordTitle})\n`;
            });
            if (high.length > 5) analysis += `... and ${high.length - 5} more\n`;
            analysis += "\n";
        }

        if (low.length > 0) {
            analysis += "**Tests with Low values:**\n";
            low.slice(0, 5).forEach(test => {
                analysis += `• ${test.investigation_name}: ${test.result} ${test.unit} (${test.recordTitle})\n`;
            });
            if (low.length > 5) analysis += `... and ${low.length - 5} more\n`;
            analysis += "\n";
        }

        analysis += "**Note:** Always consult your doctor for interpretation of lab results.";

        return analysis;
    }

    private generateImagingAnalysis(records: any[]): string {
        const allImaging = records.flatMap(record =>
            (record.extractedData?.imaging_radiology_reports || []).map(img => ({
                ...img,
                recordTitle: record.title,
                recordDate: record.date
            }))
        );

        if (allImaging.length === 0) {
            return "I don't see any imaging reports in your medical records. Please upload X-rays, CT scans, MRIs, or other imaging reports for analysis.";
        }

        let analysis = "📷 **Imaging Reports Analysis**\n\n";
        analysis += `Found ${allImaging.length} imaging report(s):\n\n`;

        allImaging.forEach((report, index) => {
            analysis += `${index + 1}. **${report.scan_type || 'Imaging Study'}** - ${report.body_part || 'Body part not specified'}\n`;
            analysis += `   📅 Date: ${report.recordDate}\n`;
            if (report.findings) {
                analysis += `   🔍 Findings: ${report.findings.substring(0, 100)}${report.findings.length > 100 ? '...' : ''}\n`;
            }
            if (report.impression) {
                analysis += `   💡 Impression: ${report.impression.substring(0, 100)}${report.impression.length > 100 ? '...' : ''}\n`;
            }
            analysis += "\n";
        });

        analysis += "**Note:** Imaging results should be interpreted by qualified radiologists and your treating physician.";

        return analysis;
    }

    private findSpecificValues(records: any[], query: string): string {
        const allInvestigations = records.flatMap(record =>
            (record.extractedData?.investigations || []).map(inv => ({
                ...inv,
                recordTitle: record.title,
                recordDate: record.date
            }))
        );

        // Extract test names from query
        const testNames = this.extractTestNamesFromQuery(query);

        if (testNames.length === 0) {
            return "I couldn't identify which specific test you're asking about. Please specify the test name (like 'hemoglobin', 'creatinine', 'glucose', etc.) and I'll look it up in your records.";
        }

        let response = "🔍 **Specific Test Results**\n\n";

        for (const testName of testNames) {
            const matchingTests = allInvestigations.filter(inv =>
                inv.investigation_name.toLowerCase().includes(testName.toLowerCase())
            );

            if (matchingTests.length === 0) {
                response += `❌ No ${testName} test found in your records.\n\n`;
                continue;
            }

            response += `**${testName.toUpperCase()} Results:**\n`;
            matchingTests.forEach(test => {
                const status = test.flag === 'High' || test.flag === 'H' ? '⚠️ HIGH' :
                              test.flag === 'Low' || test.flag === 'L' ? '⚠️ LOW' : '✅ Normal';
                response += `• ${test.result} ${test.unit} (${status}) - ${test.recordDate} from ${test.recordTitle}\n`;
                if (test.reference_range) {
                    response += `  Reference: ${test.reference_range}\n`;
                }
            });
            response += "\n";
        }

        response += "**Note:** Test results should be interpreted by your healthcare provider in the context of your overall health.";

        return response;
    }

    private generateTimelineAnalysis(records: any[]): string {
        if (records.length === 0) {
            return "You don't have any medical records to analyze over time.";
        }

        let analysis = "📅 **Timeline Analysis**\n\n";

        // Sort records by date
        const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        analysis += "Your medical records in chronological order:\n\n";

        sortedRecords.forEach((record, index) => {
            const investigations = record.extractedData?.investigations || [];
            const imaging = record.extractedData?.imaging_radiology_reports || [];

            analysis += `${index + 1}. **${record.date}** - ${record.title}\n`;
            if (investigations.length > 0) {
                analysis += `   🔬 ${investigations.length} lab test(s)\n`;
            }
            if (imaging.length > 0) {
                analysis += `   📷 ${imaging.length} imaging report(s)\n`;
            }
            analysis += "\n";
        });

        return analysis;
    }

    private analyzeAbnormalValues(records: any[]): string {
        const allInvestigations = records.flatMap(record =>
            (record.extractedData?.investigations || []).map(inv => ({
                ...inv,
                recordTitle: record.title,
                recordDate: record.date
            }))
        );

        const abnormalTests = allInvestigations.filter(inv =>
            inv.flag === 'High' || inv.flag === 'H' || inv.flag === 'Low' || inv.flag === 'L'
        );

        if (abnormalTests.length === 0) {
            return "✅ **Good news!** All your lab test results are within normal ranges. Keep up the healthy lifestyle!";
        }

        let analysis = "⚠️ **Abnormal Test Results**\n\n";
        analysis += `Found ${abnormalTests.length} test(s) with abnormal values:\n\n`;

        const highTests = abnormalTests.filter(inv => inv.flag === 'High' || inv.flag === 'H');
        const lowTests = abnormalTests.filter(inv => inv.flag === 'Low' || inv.flag === 'L');

        if (highTests.length > 0) {
            analysis += "**High Values:**\n";
            highTests.forEach(test => {
                analysis += `• ${test.investigation_name}: ${test.result} ${test.unit} (High) - ${test.recordDate}\n`;
                if (test.reference_range) {
                    analysis += `  Reference: ${test.reference_range}\n`;
                }
            });
            analysis += "\n";
        }

        if (lowTests.length > 0) {
            analysis += "**Low Values:**\n";
            lowTests.forEach(test => {
                analysis += `• ${test.investigation_name}: ${test.result} ${test.unit} (Low) - ${test.recordDate}\n`;
                if (test.reference_range) {
                    analysis += `  Reference: ${test.reference_range}\n`;
                }
            });
            analysis += "\n";
        }

        analysis += "**Important:** Abnormal results should be discussed with your healthcare provider for proper interpretation and follow-up.";

        return analysis;
    }

    private generateHelpResponse(records: any[]): string {
        let help = "🤖 **How I Can Help You**\n\n";

        if (records.length > 0) {
            const totalTests = records.reduce((sum, record) => sum + (record.extractedData?.investigations?.length || 0), 0);
            const totalImaging = records.reduce((sum, record) => sum + (record.extractedData?.imaging_radiology_reports?.length || 0), 0);

            help += `You have ${records.length} medical records with ${totalTests} lab tests and ${totalImaging} imaging reports.\n\n`;
        }

        help += "I can help you with:\n\n";
        help += "📊 **Summaries & Overviews**\n";
        help += "• \"Give me a summary of my medical records\"\n";
        help += "• \"What are my recent test results?\"\n\n";

        help += "🔬 **Lab Test Analysis**\n";
        help += "• \"What is my hemoglobin level?\"\n";
        help += "• \"Check my creatinine values\"\n";
        help += "• \"Show me abnormal test results\"\n\n";

        help += "📷 **Imaging Reports**\n";
        help += "• \"What imaging studies do I have?\"\n";
        help += "• \"Show me my X-ray reports\"\n\n";

        help += "📅 **Timeline & Trends**\n";
        help += "• \"When was my last blood test?\"\n";
        help += "• \"Show me results over time\"\n\n";

        help += "**Remember:** I'm here to help you understand your records, but always consult your healthcare provider for medical advice!";

        return help;
    }

    private extractSpecificTestQueries(query: string): string[] {
        const commonTests = [
            'hemoglobin', 'hb', 'hgb', 'hematocrit', 'hct',
            'creatinine', 'bun', 'urea', 'uric acid',
            'glucose', 'blood sugar', 'sugar',
            'cholesterol', 'hdl', 'ldl', 'triglycerides',
            'platelet', 'wbc', 'rbc', 'neutrophil', 'lymphocyte',
            'bilirubin', 'sgot', 'sgpt', 'alt', 'ast',
            'calcium', 'phosphorus', 'potassium', 'sodium',
            'vitamin d', 'vitamin b12', 'folic acid',
            'tsh', 't3', 't4', 'thyroid',
            'hba1c', 'glycosylated hemoglobin'
        ];

        return commonTests.filter(test =>
            query.toLowerCase().includes(test.toLowerCase())
        );
    }

    private extractTestNamesFromQuery(query: string): string[] {
        // Extract test names from natural language queries
        const testPatterns = [
            /(?:what is|what was|check|show) my ([\w\s]+?)(?:\s+level|\s+value|\s+result|$)/i,
            /my ([\w\s]+?)(?:\s+level|\s+value|\s+result|$)/i,
            /(?:hemoglobin|creatinine|glucose|cholesterol|platelet|bilirubin|calcium|potassium|sodium|vitamin|thyroid|hba1c|cbc|bun|urea|uric acid|sgot|sgpt|alt|ast|hdl|ldl|triglycerides|tsh|t3|t4|wbc|rbc|neutrophil|lymphocyte|hematocrit|hct)/gi
        ];

        const foundTests = new Set<string>();

        for (const pattern of testPatterns) {
            const matches = query.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Clean up the extracted test name
                    const cleanMatch = match.toLowerCase()
                        .replace(/^(?:what is|what was|check|show) my /, '')
                        .replace(/ my /, '')
                        .replace(/(?:level|value|result)$/i, '')
                        .trim();

                    if (cleanMatch.length > 2) {
                        foundTests.add(cleanMatch);
                    }
                });
            }
        }

        return Array.from(foundTests);
    }

    private getSpecificTestResults(investigations: any[], testNames: string[]): string {
        let response = "🔬 **Specific Test Results**\n\n";

        for (const testName of testNames) {
            const matchingTests = investigations.filter(inv =>
                inv.investigation_name.toLowerCase().includes(testName.toLowerCase())
            );

            if (matchingTests.length === 0) {
                response += `❌ No ${testName} test found in your records.\n\n`;
                continue;
            }

            response += `**${testName.toUpperCase()} Results:**\n`;

            // Sort by date (most recent first)
            matchingTests.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());

            matchingTests.forEach((test, index) => {
                const status = test.flag === 'High' || test.flag === 'H' ? '⚠️ HIGH' :
                              test.flag === 'Low' || test.flag === 'L' ? '⚠️ LOW' : '✅ Normal';

                response += `${index + 1}. ${test.result} ${test.unit} (${status}) - ${test.recordDate}\n`;
                if (test.reference_range) {
                    response += `   Reference range: ${test.reference_range}\n`;
                }
                response += `   From: ${test.recordTitle}\n\n`;
            });
        }

        response += "**Note:** Always consult your healthcare provider for interpretation of these results.";

        return response;
    }

    private extractResponseText(responseData: any): string {
        // Try different possible response field names
        if (responseData?.response) return responseData.response;
        if (responseData?.message) return responseData.message;
        if (responseData?.text) return responseData.text;
        if (responseData?.content) return responseData.content;
        if (responseData?.answer) return responseData.answer;
        if (responseData?.result) return responseData.result;

        // If it's a string, return it directly
        if (typeof responseData === 'string') return responseData;

        // Try to stringify and look for response-like content
        const stringified = JSON.stringify(responseData);
        const responseMatch = stringified.match(/"response"\s*:\s*"([^"]+)"/);
        if (responseMatch) return responseMatch[1];

        // Last resort fallback
        return "I apologize, but I'm having trouble processing your request. Please try rephrasing your question or contact your healthcare provider for medical advice.";
    }

    private formatTextPayload(payload: ChatPayload) {
        return {
            message: payload.message,
            patient_id: payload.patient_id,
            patient_context: payload?.patient_context,
            conversation_id: payload.conversation_id
        };
    }

    private formatVoicePayload(payload: ChatPayload) {
        const formData = new FormData();
        formData.append('audio_base64', payload.audio_url);
        formData.append('patient_id', payload.patient_id);
        formData.append('patient_context', JSON.stringify(payload.patient_context));
        formData.append('conversation_id', payload.conversation_id || '');
        formData.append('talk_back', payload?.talk_back ? true : false as any)
        return formData;
    }

    async getAudio(payload: { audio_id: string }) {
        const endpoint = `${this.getAiEndPoint()}/medical-chatbot/medical-chat/voice/download/${payload.audio_id}`;
        try {
            const response = await firstValueFrom(
                this.httpService.post(endpoint, payload)
            );

            if (!response) {
                this.logger.warn('File not found or empty: ' + payload.audio_id);
                return null;
            }

            return response;

        } catch (error) {
            this.logger.error('Error:', error);
            return null;
        }
    }

    async processVoiceChat(body: any, audioFile: any) {
        try {
            this.logger.log('Processing voice chat with audio file:', audioFile?.originalname);

            // Convert audio buffer to base64 for local processing
            const audioBase64 = audioFile?.buffer?.toString('base64') || '';

            // Simulate voice transcription locally (in a real implementation, this would use a speech-to-text service)
            // For now, we'll provide a placeholder transcription based on common voice inputs
            let transcribedText = 'Voice input processed'; // Default fallback

            // Try to detect if this is a common voice command and provide appropriate transcription
            if (audioBase64.length > 1000) { // If we have actual audio data
                // In a real implementation, you would call a speech-to-text service here
                // For demo purposes, we'll simulate transcription of common medical queries
                transcribedText = this.simulateVoiceTranscription(audioBase64);
            }

            const payload: ChatPayload = {
                patient_id: body.patient_id || '1',
                message: transcribedText,
                conversation_id: body.conversation_id,
                audio_url: audioBase64,
                patient_context: body.patient_context || {},
                type: 'voice',
                talk_back: body.talk_back || false
            };

            // Use the EMR AI Bot system directly - no external API calls
            const contextualResponse = this.generateEMRContextualResponse(payload);

            // Generate voice audio for the response
            const audioData = contextualResponse ? this.generateVoiceAudio(contextualResponse) : '';

            return {
                success: true,
                message: "Voice chat processed",
                data: {
                    response: contextualResponse || "",
                    conversation_id: payload.conversation_id,
                    detected_language: 'en',
                    response_language: 'en',
                    examination_stage: 'general',
                    follow_up_questions: [],
                    medical_insights: {},
                    urgency_level: 'normal',
                    timestamp: new Date().toISOString(),
                    transcribed_text: transcribedText,
                    audio_id: `voice_${Date.now()}_${payload.patient_id}`,
                    audio_url: contextualResponse ? `data:audio/wav;base64,${audioData}` : '',
                    voice_language: 'en'
                }
            };
        } catch (error) {
            this.logger.error('Error processing voice chat:', error);
            // Return a fallback response instead of failing
            const fallbackPayload: ChatPayload = {
                patient_id: body.patient_id || '1',
                message: 'Voice input processed',
                conversation_id: body.conversation_id,
                patient_context: body.patient_context || {},
                type: 'voice'
            };

            const fallbackResponse = this.generateEMRContextualResponse(fallbackPayload);

            return {
                success: true,
                message: "Voice chat processed with fallback",
                data: {
                    response: fallbackResponse,
                    conversation_id: body.conversation_id,
                    detected_language: 'en',
                    response_language: 'en',
                    examination_stage: 'general',
                    follow_up_questions: [],
                    medical_insights: {},
                    urgency_level: 'normal',
                    timestamp: new Date().toISOString(),
                    transcribed_text: 'Voice input processed',
                    audio_id: `voice_${Date.now()}_${body.patient_id || '1'}`,
                    audio_url: fallbackResponse ? `data:audio/wav;base64,${this.generateVoiceAudio(fallbackResponse)}` : '',
                    voice_language: 'en'
                }
            };
        }
    }

    private simulateVoiceTranscription(audioBase64: string): string {
        // This is a simulation - in a real implementation, you would use Google Speech-to-Text, AWS Transcribe, etc.
        // For demo purposes, we'll return common medical queries that users might speak

        const commonQueries = [
            "What are my recent test results?",
            "Can you check my blood pressure readings?",
            "What medications should I be taking?",
            "Explain my lab results",
            "How is my cholesterol level?",
            "What does my CBC report show?",
            "Can you summarize my medical records?",
            "What are my abnormal test results?",
            "Show me my latest blood test",
            "What is my hemoglobin level?"
        ];

        // Simulate randomness based on audio data length (not truly random, but varies per audio)
        const index = audioBase64.length % commonQueries.length;
        return commonQueries[index];
    }

    async startVoiceRecording(body: any) {
        try {
            this.logger.log('Starting voice recording for patient:', body.patient_id);

            // Initialize recording session
            const sessionId = `recording_${Date.now()}_${body.patient_id}`;

            return {
                success: true,
                message: 'Voice recording started',
                data: {
                    session_id: sessionId,
                    status: 'recording',
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logger.error('Error starting voice recording:', error);
            return {
                success: false,
                message: 'Failed to start voice recording',
                error: error.message
            };
        }
    }

    async stopVoiceRecording(body: any) {
        try {
            this.logger.log('Stopping voice recording for session:', body.session_id);

            return {
                success: true,
                message: 'Voice recording stopped',
                data: {
                    session_id: body.session_id,
                    status: 'stopped',
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logger.error('Error stopping voice recording:', error);
            return {
                success: false,
                message: 'Failed to stop voice recording',
                error: error.message
            };
        }
    }

    async getSummary(id: string, options = { format: true }) {
        const endpoint = `${this.getAiEndPoint()}/medical-chatbot/medical-chat/conversations/${id}`;
        try {
            const response = await firstValueFrom(
                this.httpService.get<any>(endpoint)
            );
            return this.summarizeChat(response, options);
        } catch (error) {
            this.logger.error('Error:', error);
            return this.error("Failed to retrieve summary", error, options);
        }
    }

    private async summarizeChat(chat:Record<string, any>,  options) {
        const endpoint = `${this.getAiEndPoint()}/transcribe/process-medical-audio`;
        const payload = {
            gcs_path: 'gs://',
            free_text: jsonToKeyValueString(chat),
        }
        try {
            const response = await firstValueFrom(
                this.httpService.post<any>(endpoint, payload)
            );
            return this.success(response, "Chat summarized successfully", options);
        } catch (error) {
            this.logger.error('Error:', error);
            return this.error("Failed to summarize chat", error, options);
        }

    }

    private getAiEndPoint() {
        return process.env.AI_ENDPOINT || 'https://emr-utils-test-363382968588.asia-south1.run.app';
    }

    private success(data: any, message: string, options: any) {
        if (options.format) {
            return {
                success: true,
                message,
                data
            };
        }
        return data;
    }

    private error(message: string, error: any, options: any) {
        if (options.format) {
            return {
                success: false,
                message,
                error: error?.message || error
            };
        }
        throw new Error(message);
    }
}