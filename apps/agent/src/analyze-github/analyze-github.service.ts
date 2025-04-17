import { Injectable } from '@nestjs/common';
import { ChatAgent } from '../chat-agent/chatAgent';
import {
  distributeReward,
  analyzeProject,
  listProjects,
  createTasks,
  allocateTasks,
} from './function';

@Injectable()
export class AnalyzeGithubService {
  private readonly chatAgent: ChatAgent;

  // To make sure the API_KEY is not rate limited, we use two keys.
  constructor() {
    if (!process.env.API_KEY || !process.env.API_KEY_2) {
      throw new Error('API_KEY is not defined');
    }

    const apiKey = process.env.API_KEY;
    const apiKey2 = process.env.API_KEY_2;

    // Initialize ChatAgent
    this.chatAgent = new ChatAgent(
      apiKey,
      `I am a GitHub-integrated Agent that bridges development and investment in open source projects.

For Developers:
- I break down tasks into well-defined GitHub issues
- I assign tasks to the most suitable developers based on expertise
- I generate weekly progress reports and can share updates on Twitter

For Investors:
- I provide technical due diligence from a developer's perspective and generate comprehensive project analysis reports

As a Hackathon Judge:
- I assess projects based on innovation, technical complexity, and market potential and provide detailed scoring with specific feedback in each category.

Let me know how I can assist you with project analysis, development planning, or technical evaluation.`,
    );
  }

  async handleMessage(message: string) {
    const chat = await this.chatAgent.createChat({
      partnerId: 'chatGithub',
      partnerName: 'Chat Github',
      actionSpace: [
        allocateTasks,
        createTasks,
        distributeReward,
        analyzeProject,
        listProjects,
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
