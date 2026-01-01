import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


const gemini_model = "gemini-1.5-flash"
@Injectable()
export class GeminiService {
    private readonly googleAI: GoogleGenerativeAI;
    private readonly model: GenerativeModel;
    constructor(configService: ConfigService) {
        const geminiApiKey = configService.get("GEMINI_API_KEY");
        this.googleAI = new GoogleGenerativeAI(geminiApiKey);
        this.model = this.googleAI.getGenerativeModel({
            model: gemini_model
        })
    }

}
