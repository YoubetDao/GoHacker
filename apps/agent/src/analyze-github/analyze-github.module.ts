import { Module } from '@nestjs/common';
import { AnalyzeGithubService } from './analyze-github.service';
import { AnalyzeGithubController } from './analyze-github.controller';

@Module({
  controllers: [AnalyzeGithubController],
  providers: [AnalyzeGithubService],
})
export class AnalyzeGithubModule {}
