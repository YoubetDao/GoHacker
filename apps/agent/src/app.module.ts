import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyzeGithubModule } from './analyze-github/analyze-github.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 使配置在所有模块中可用
      envFilePath: ['../../.env', '.env'], // 先尝试项目根目录的 .env，然后是当前目录的 .env
    }),
    AnalyzeGithubModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
