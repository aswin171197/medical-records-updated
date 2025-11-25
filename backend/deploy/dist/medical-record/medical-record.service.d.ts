import { HttpService } from '@nestjs/axios';
import { IUserInfo } from '../common/interfaces/user-info.interface';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class MedicalRecordService {
    private readonly httpService;
    private extractedDataStore;
    private fileStore;
    constructor(httpService: HttpService);
    private BASE_API;
    extractFiles(body: {
        patientId?: number;
        appointmentId?: number;
        id?: number;
    }, files: MulterFile[], userInfo: IUserInfo, options?: {
        format: boolean;
    }): Promise<any[]>;
    private getExtractedData;
    processHistoryExtraction(body: {
        id: number;
        transcript: any;
        filename?: string;
    }, userInfo: IUserInfo, options?: any): Promise<{
        fileName: string;
        extraction: any;
    }>;
    private getRequestHeader;
    private jsonToKeyValueString;
    private formatClinicalDetails;
    private extractTextFromFile;
    private extractTextFromPdf;
    private extractTextWithOCR;
    generateDownloadContent(blobName: string): Promise<string>;
    generatePreviewContent(blobName: string): Promise<string>;
    private getFallbackTextByName;
    getOriginalFile(blobName: string): Promise<Buffer>;
    private parseBillingInvestigations;
    private extractStructuredData;
    private parseLabResults;
    private shouldSkipMethodologyLine;
    private normalizeFlag;
    private cleanTestNameForParsing;
    private parseSpecificLabFormat;
    private isValidLabResult;
    private isHeaderLine;
    private extractUnit;
    private cleanLabResults;
    private determineFlag;
    private extractValue;
    private extractImagingReports;
    private detectBodyPartFromText;
    private detectScanTypeFromText;
    private extractLongTextSection;
    private extractOtherClinicalData;
    extractFileWithOCR(files: MulterFile[]): Promise<any[]>;
    private performOCRExtraction;
    private extractMedicalContentFromOCR;
}
export {};
