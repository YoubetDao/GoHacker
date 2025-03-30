import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzeGithubController } from './analyze-github.controller';
import { AnalyzeGithubService } from './analyze-github.service';

describe('AnalyzeGithubController', () => {
  let controller: AnalyzeGithubController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyzeGithubController],
      providers: [AnalyzeGithubService],
    }).compile();

    controller = module.get<AnalyzeGithubController>(AnalyzeGithubController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
