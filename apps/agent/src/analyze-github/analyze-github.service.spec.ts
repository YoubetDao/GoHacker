import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzeGithubService } from './analyze-github.service';

describe('AnalyzeGithubService', () => {
  let service: AnalyzeGithubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyzeGithubService],
    }).compile();

    service = module.get<AnalyzeGithubService>(AnalyzeGithubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
