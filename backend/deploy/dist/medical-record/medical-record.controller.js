"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const medical_record_service_1 = require("./medical-record.service");
let MedicalRecordController = class MedicalRecordController {
    constructor(service) {
        this.service = service;
    }
    async extractFiles(body, files) {
        const userInfo = { id: '1', email: 'user@example.com', orgId: '1' };
        console.log('Extract files endpoint hit with files:', files?.length || 0);
        if (body && body.data) {
            body = JSON.parse(body.data);
        }
        return await this.service.extractFiles(body || {}, files, userInfo);
    }
    async extractFile(files) {
        console.log('Extract file endpoint hit with files:', files?.length || 0);
    }
    async downloadFile(body, res) {
        try {
            const fileName = body.blob_name.split('/').pop() || 'medical-record';
            const content = await this.service.generateDownloadContent(body.blob_name);
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}_extracted.txt"`);
            res.send(content);
        }
        catch (error) {
            console.error('Error downloading file:', error);
            throw new common_1.HttpException('Failed to download file', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async previewFile(body, res) {
        try {
            console.log('Preview request for blob_name:', body.blob_name);
            const fileBuffer = await this.service.getOriginalFile(body.blob_name);
            console.log('Retrieved file buffer, size:', fileBuffer.length, 'bytes');
            const header = fileBuffer.subarray(0, 5).toString();
            console.log('File header check:', header);
            if (header !== '%PDF-') {
                console.warn('File does not appear to be a valid PDF!');
                console.log('First 100 bytes as hex:', fileBuffer.subarray(0, 100).toString('hex'));
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            res.setHeader('Cache-Control', 'no-cache');
            res.send(fileBuffer);
        }
        catch (error) {
            console.error('Error previewing file:', error);
            throw new common_1.HttpException('Failed to preview file', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async viewPdfGet(blobName, res) {
        try {
            const fileBuffer = await this.service.getOriginalFile(blobName);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            res.send(fileBuffer);
        }
        catch (error) {
            console.error('Error viewing PDF:', error);
            throw new common_1.HttpException('Failed to view PDF', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async viewPdfPost(body, res) {
        try {
            const pdfBuffer = await this.service.getOriginalFile(body.blob_name);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            res.send(pdfBuffer);
        }
        catch (error) {
            console.error('Error viewing PDF:', error);
            throw new common_1.HttpException('Failed to view PDF', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.MedicalRecordController = MedicalRecordController;
__decorate([
    (0, common_1.Post)('extract-files'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], MedicalRecordController.prototype, "extractFiles", null);
__decorate([
    (0, common_1.Post)('extract-file'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], MedicalRecordController.prototype, "extractFile", null);
__decorate([
    (0, common_1.Post)('download-file'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MedicalRecordController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Post)('preview-file'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MedicalRecordController.prototype, "previewFile", null);
__decorate([
    (0, common_1.Get)('view-pdf'),
    __param(0, (0, common_1.Query)('blob_name')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MedicalRecordController.prototype, "viewPdfGet", null);
__decorate([
    (0, common_1.Post)('view-pdf'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MedicalRecordController.prototype, "viewPdfPost", null);
exports.MedicalRecordController = MedicalRecordController = __decorate([
    (0, common_1.Controller)('medical-record'),
    __metadata("design:paramtypes", [medical_record_service_1.MedicalRecordService])
], MedicalRecordController);
//# sourceMappingURL=medical-record.controller.js.map