import { PartialType } from '@nestjs/mapped-types';
import { CreateAnalyzeGithubDto } from './create-analyze-github.dto';

export class UpdateAnalyzeGithubDto extends PartialType(CreateAnalyzeGithubDto) {}
