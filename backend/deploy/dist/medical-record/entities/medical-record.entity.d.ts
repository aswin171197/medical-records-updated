import { User } from '../../users/entities/user.entity';
export declare class MedicalRecord {
    id: number;
    userId: number;
    user: User;
    fileName: string;
    extractedData: any;
    investigations: any[];
    imagingReports: any[];
    otherClinicalData: string;
    blobName: string;
    createdAt: Date;
}
