import { Injectable } from '@nestjs/common';
import { ChatAgent } from '../chat-agent/chatAgent';
import { assignIssue, createIssue, getProjectIssue } from './function';

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
      'you are an agent can analyze github repository, assign issue to the right person, and create issue if needed. User may also ask you some questions about the Hackathon and other web3 related questions.',
    );
  }

  async handleMessage(message: string) {
    const chat = await this.chatAgent.createChat({
      partnerId: 'chatGithub',
      partnerName: 'Chat Github',
      actionSpace: [getProjectIssue, assignIssue, createIssue],
    });

    // 发送更明确的指令，要求 AI 调用函数并传递参数
    // const message = `Please analyze the GitHub repository: ${repoName}. `;

    const response = await chat.next(message);

    if (response.functionCall) {
      console.log(`Function call: ${response.functionCall.fn_name}`);
    }


    return response;
  }
}
