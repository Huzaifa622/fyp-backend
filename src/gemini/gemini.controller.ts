import { Body, Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { GeminiPrompt } from './dto/gemini-prompt.dto';
import { GeminiService } from './gemini.service';

class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File to upload' })
  file: any;
}



@Controller('gemini')
export class GeminiController {

  constructor(private readonly geminiService: GeminiService) { }
  @ApiBearerAuth()
  @ApiOperation({ summary: "gemini api with image and text" })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload up to 5 images and a prompt',
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' }
        },
        prompt: { type: 'string' }
      }
    }
  })
  uploadFile(@UploadedFiles() images: Express.Multer.File[], @Body() body: GeminiPrompt) {
   return this.geminiService.getPromptWithImageResponse(images, body.prompt)
  }

}
