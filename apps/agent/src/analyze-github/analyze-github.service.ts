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

  async handleMessage(message: string) {
    const chat = await this.chatAgent.createChat({
      partnerId: 'chatGithub',
      partnerName: 'Chat Github',
      actionSpace: [getProjectIssue],
    });

    const response = await chat.next(message);

    return response;
  }
}
