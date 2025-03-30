import { Controller, Post, Body } from '@nestjs/common';
import { AnalyzeGithubService } from './analyze-github.service';

// 定义请求体类型
class MessageDto {
  description: string;
}

@Controller('analyze-github')
export class AnalyzeGithubController {
  constructor(private readonly analyzeGithubService: AnalyzeGithubService) {}

  @Post('message')
  async handleMessage(@Body() messageDto: MessageDto) {
    return this.analyzeGithubService.handleMessage(messageDto.description);
  }
}
