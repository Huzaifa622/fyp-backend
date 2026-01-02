import { Body, Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { GeminiPrompt } from './dto/gemini-prompt.dto';

class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File to upload' })
  file: any;
}



@Controller('gemini')
export class GeminiController {

    @ApiOperation({ summary: "gemini api with image and text" })
    @Post('upload')
    @UseInterceptors(FilesInterceptor('images', 5))
    @ApiConsumes('multipart/form-data')
      @ApiBody({
    description: 'Upload a single file with an optional title',
    type: FileUploadDto, // Use the combined DTO for Swagger
  })
    uploadFile(@UploadedFiles() images: Express.Multer.File, @Body() body: GeminiPrompt) {
        console.log(images, body.prompt);
    }

}
