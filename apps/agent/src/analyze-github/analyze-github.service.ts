import { Injectable } from '@nestjs/common';
import { ChatAgent } from '../chat-agent/chatAgent';
import { getProjectIssue } from './function';

@Injectable()
export class AnalyzeGithubService {
  private readonly chatAgent: ChatAgent;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error('API_KEY is not defined');
    }

    // Initialize ChatAgent
    this.chatAgent = new ChatAgent(
      process.env.API_KEY,
      'you are an agent can analyze github repository',
    );
  }

  async handleMessage(repoName: string) {
    const chat = await this.chatAgent.createChat({
      partnerId: 'chatGithub',
      partnerName: 'Chat Github',
      actionSpace: [getProjectIssue],
    });

    // 发送更明确的指令，要求 AI 调用函数并传递参数
    // const message = `Please analyze the GitHub repository: ${repoName}. `;

    console.log('repoName', repoName);

    const response = await chat.next(repoName);

    if (response.functionCall) {
      console.log(`Function call: ${response.functionCall.fn_name}`);
    }

    console.log('response', response);

    return response;
  }
}
