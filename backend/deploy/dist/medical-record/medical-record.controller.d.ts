import { Response } from 'express';
import { MedicalRecordService } from './medical-record.service';
export declare class MedicalRecordController {
    private readonly service;
    constructor(service: MedicalRecordService);
    extractFiles(body: any, files: any[]): Promise<any[]>;
    extractFile(files: any[]): Promise<void>;
    downloadFile(body: {
        blob_name: string;
        bucket?: string;
    }, res: Response): Promise<void>;
    previewFile(body: {
        blob_name: string;
    }, res: Response): Promise<void>;
    viewPdfGet(blobName: string, res: Response): Promise<void>;
    viewPdfPost(body: {
        blob_name: string;
    }, res: Response): Promise<void>;
}
