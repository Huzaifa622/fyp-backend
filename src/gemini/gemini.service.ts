import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from "fs";

@Injectable()
export class GeminiService {
    private readonly googleAI: GoogleGenerativeAI;
    private readonly model: GenerativeModel;
    private readonly logger = new Logger(GeminiService.name);

    constructor(configService: ConfigService) {
        const geminiApiKey = configService.get("GEMINI_API_KEY");
        this.googleAI = new GoogleGenerativeAI(geminiApiKey);
        this.model = this.googleAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite"
        });
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

   async getPromptWithImageResponse(images: Array<Express.Multer.File>, prompt: string): Promise<string> {
    const imagesPart = images.map(img => this.fileToGenerativePartFromFile(img));
    
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        try {
            const result = await this.model.generateContent([prompt, ...imagesPart]);
            const response = await result.response;
            return response.text(); // Success return

        } catch (error: any) {
            attempts++;
            const status = error.status || error.response?.status;
            
            if (status === 429 && attempts < maxAttempts) {
                this.logger.warn(`Rate limit hit. Waiting 22s before retry ${attempts}...`);
                await this.sleep(22000);
                continue; 
            }

            // If it's not a 429, or we've run out of retries, throw an error
            throw new HttpException(
                error.message || 'Gemini API Error',
                status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // --- THIS IS WHAT WAS MISSING ---
    // This line ensures the function always returns or throws
    throw new HttpException('Request failed after maximum retry attempts', HttpStatus.TOO_MANY_REQUESTS);
}   

    fileToGenerativePartFromFile(file: Express.Multer.File): { inlineData: { data: string; mimeType: string } } {
        try {
            const mimeType = file.mimetype || 'application/octet-stream';
            const base64Data = file.buffer 
                ? file.buffer.toString('base64') 
                : fs.readFileSync(file.path).toString('base64');

            return {
                inlineData: {
                    data: base64Data,
                    mimeType,
                },
            };
        } catch (err) {
            throw new HttpException('Error processing image file', HttpStatus.BAD_REQUEST);
        }
    }
}