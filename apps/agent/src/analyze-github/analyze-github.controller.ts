import { Controller, Post, Body } from '@nestjs/common';
import { AnalyzeGithubService } from './analyze-github.service';

@Controller('analyze-github')
export class AnalyzeGithubController {
  constructor(private readonly analyzeGithubService: AnalyzeGithubService) {}

  @Post('message')
  async handleMessage(@Body() message: string) {
    return this.analyzeGithubService.handleMessage(message);
  }
}
