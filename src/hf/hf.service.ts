import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HfService {
  private readonly hfApiToken: string;
  // Using the OpenAI-compatible endpoint provided by HF Inference for supported models
  private readonly modelUrl =
    'https://router.huggingface.co/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.hfApiToken = this.configService.get<string>('HF_API_TOKEN') || '';
  }

  async generateReport(
    description: string,
    imageUrls: string[],
  ): Promise<{
    content: string;
    diseaseName: string;
    confidenceScore: string;
  }> {
    if (!this.hfApiToken) {
      throw new InternalServerErrorException('HF_API_TOKEN is not configured');
    }

    try {
      // Constructing payload for OpenAI-compatible endpoint
      // Qwen2.5-VL-7B-Instruct on HF Inference is typically powered by TGI which supports this standard.

      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Patient Description: ${description}. Please analyze the attached skin condition images and provide a detailed report and respond using ONLY plain text. 
                
                Requirements:
                1. Result Limit: Approximately 300 words.
                2. Structure:
                  - Disease Name: [Name]
                  - Confidence Score in %
                  - Detailed Report: [Diagnosis, Severity, and Recommendations]
                3. Strictly maintain professional medical tone.
                4. Do not include any additional information or formatting.
                STRICT OUTPUT RULES (MANDATORY):
- No markdown symbols (**, ##, -, *, _)
- No bullet points
- No line breaks or newline characters
- Use a single continuous paragraph
- Use ":" only for field labels

EXACT OUTPUT FORMAT (DO NOT DEVIATE):
Disease Name: <text>. Confidence Score: <percentage>. Detailed Report: <text>.

If you violate formatting rules, the response is invalid.
                `,
            },
            ...imageUrls.map((img) => ({
              type: 'image_url',
              image_url: {
                url: img,
              },
            })),
          ],
        },
      ];

      const payload = {
        model: 'Qwen/Qwen2.5-VL-7B-Instruct',
        messages: messages,
        max_tokens: 1000,
        stream: false,
      };

      const response = await axios.post(this.modelUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.hfApiToken}`,
          'Content-Type': 'application/json',
        },
      });

      // OpenAI format response
      const content =
        response.data?.choices?.[0]?.message?.content ||
        JSON.stringify(response.data);

      // Parse fields using Regex
      const diseaseMatch = content.match(/Disease Name:\s*([^\.]+)/i);
      const confidenceMatch = content.match(/Confidence Score:\s*([\d.]+%)/i);
      const reportMatch = content.match(/Detailed Report:\s*(.+)$/i);

      return {
        content: reportMatch ? reportMatch[1].trim() : 'Unknown',
        diseaseName: diseaseMatch ? diseaseMatch[1].trim() : 'Unknown',
        confidenceScore: confidenceMatch
          ? confidenceMatch[1].trim()
          : 'Unknown',
      };
    } catch (error) {
      console.error(
        'Error integrating with Hugging Face:',
        error.response?.data || error.message,
      );
      // Fallback: If 404, maybe the v1/chat/completions isn't enabled for this model on free tier.
      // But let's verify.
      if (error.response?.status === 404) {
        throw new InternalServerErrorException(
          'Model endpoint not found. Ensure the model supports Chat Completions API or check URL.',
        );
      }
      throw new InternalServerErrorException('Failed to generate AI report');
    }
  }
}
