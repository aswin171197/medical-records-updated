import { Controller, Post, Get, Body, Query, UseGuards, Request, Res, HttpException, HttpStatus, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IUserInfo } from '../common/interfaces/user-info.interface';
import { Response } from 'express';
import { MedicalRecordService } from './medical-record.service';

@Controller('medical-record')
export class MedicalRecordController {
  constructor(private readonly service: MedicalRecordService) {}
  
  @Post('extract-files')
  @UseInterceptors(FilesInterceptor('files', 10))
  async extractFiles(@Body() body: any, @UploadedFiles() files: any[]) {
    const userInfo: IUserInfo = { id: '1', email: 'user@example.com', orgId: '1' };
    console.log('Extract files endpoint hit with files:', files?.length || 0);
    if (body && body.data) {
      body = JSON.parse(body.data);
    }
    return await this.service.extractFiles(body || {}, files, userInfo);
  }

  @Post('extract-file')
  @UseInterceptors(FilesInterceptor('files', 10))
  async extractFile(@UploadedFiles() files: any[]) {
    console.log('Extract file endpoint hit with files:', files?.length || 0);
    // return await this.service.extractFileWithOCR(files);
  }

  @Post('download-file')
  async downloadFile(@Body() body: { blob_name: string; bucket?: string }, @Res() res: Response) {
    try {
      const fileName = body.blob_name.split('/').pop() || 'medical-record';
      const content = await this.service.generateDownloadContent(body.blob_name);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}_extracted.txt"`);
      res.send(content);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new HttpException('Failed to download file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  @Post('preview-file')
  async previewFile(@Body() body: { blob_name: string }, @Res() res: Response) {
    try {
      console.log('Preview request for blob_name:', body.blob_name);
      const fileBuffer = await this.service.getOriginalFile(body.blob_name);
      console.log('Retrieved file buffer, size:', fileBuffer.length, 'bytes');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error previewing file:', error);
      throw new HttpException('Failed to preview file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('view-pdf')
  async viewPdfGet(@Query('blob_name') blobName: string, @Res() res: Response) {
    try {
      const fileBuffer = await this.service.getOriginalFile(blobName);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      throw new HttpException('Failed to view PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('view-pdf')
  async viewPdfPost(@Body() body: { blob_name: string }, @Res() res: Response) {
    try {
      const pdfBuffer = await this.service.getOriginalFile(body.blob_name);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      throw new HttpException('Failed to view PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}