import { ApiProperty } from '@nestjs/swagger';

export class GeminiPrompt {
    @ApiProperty({ description: 'The text prompt to accompany the image(s)' })
    prompt: string;
}