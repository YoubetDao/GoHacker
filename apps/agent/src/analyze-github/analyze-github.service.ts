import { Injectable } from '@nestjs/common';
import { ChatAgent } from '../chat-agent/chatAgent';
import {
  allocateIssue,
  createIssue,
  distributeReward,
  getProjectIssue,
  judgeProjects,
} from './function';

@Injectable()
export class AnalyzeGithubService {
  private readonly chatAgent: ChatAgent;

  constructor() {
    if (!process.env.API_KEY || !process.env.API_KEY_2) {
      throw new Error('API_KEY is not defined');
    }

    const apiKey = process.env.API_KEY;
    const apiKey2 = process.env.API_KEY_2;

    // Initialize ChatAgent
    this.chatAgent = new ChatAgent(
      apiKey2,
      `You are an agent can analyze Hackathon project needs and create related issues, assign issue to the right person. User may also ask you some questions about the Hackathon and other web3 related questions.
      You can also play a role of a Hackathon judger to judge all the projects. And give them rewards.
      Finally, if winner want to split their rewards, you can help them to split the rewards based on their contributions, and send the rewards to their wallets.
      通常来说用中文回答就行。`,
    );
  }

  async handleMessage(message: string) {
    const chat = await this.chatAgent.createChat({
      partnerId: 'chatGithub',
      partnerName: 'Chat Github',
      actionSpace: [
        getProjectIssue,
        allocateIssue,
        createIssue,
        distributeReward,
        judgeProjects,
      ],
    });

    // 发送更明确的指令，要求 AI 调用函数并传递参数
    // const message = `Please analyze the GitHub repository: ${repoName}. `;

    const response = await chat.next(message);

    if (response.functionCall) {
      console.log(`Function call: ${response.functionCall.fn_name}`);
    }

    await chat.end();

    return response;
  }
}
