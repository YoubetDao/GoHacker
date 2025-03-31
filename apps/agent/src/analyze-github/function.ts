import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameFunction,
} from '@virtuals-protocol/game';
import { Octokit } from 'octokit';
import OpenAI from 'openai';

export const getProjectIssue = new GameFunction({
  name: 'get_project_issue',
  description:
    'Query issues from a GitHub repository and return a structured list of issues, including the following fields for each issue: title, status (open or closed), category (e.g., bug, enhancement), and assignee (username or null if unassigned).',
  args: [],
  executable: async (args, logger) => {
    const github = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    // 获取仓库的所有 issues
    const { data: issues } = await github.rest.issues.listForRepo({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      state: 'open',
      per_page: 100,
    });

    if (!issues || issues.length === 0) {
      console.log('No open issues found in the repository');
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify({
          issues: [],
        }),
      );
    }

    // 过滤掉 Pull Requests - 只保留实际的 Issues
    const actualIssues = issues.filter((issue) => !issue.pull_request);

    if (actualIssues.length === 0) {
      console.log('No open issues found (excluding pull requests)');
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify({
          issues: [],
        }),
      );
    }

    // 转换为更友好的格式
    const formattedTasks = actualIssues.map((issue) => {
      // 提取标签信息
      const priority =
        issue.labels
          .find((label) => label.name.startsWith('priority:'))
          ?.name.replace('priority:', '') || 'N/A';
      const effort =
        issue.labels
          .find((label) => label.name.startsWith('effort:'))
          ?.name.replace('effort:', '') || 'N/A';
      const category =
        issue.labels.find((label) =>
          process.env.TASK_CATEGORIES?.split(',').includes(label.name),
        )?.name || 'N/A';

      return {
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        status: issue.state,
        assignee: issue.assignee?.login || 'Unassigned',
        priority,
        effort,
        category,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
      };
    });

    console.log(
      'formattedTasks',
      JSON.stringify({
        issues: formattedTasks,
      }),
    );

    return new ExecutableGameFunctionResponse(
      ExecutableGameFunctionStatus.Done,
      `You are given a plain text list of GitHub issues. Please convert it into a clean, well-formatted Markdown list, where each issue is presented as a bullet point with the following details:
	•	The issue title in bold
	•	Status (open or closed)
	•	Assignee (use unassigned if none)
	•	Creation date (YYYY-MM-DD format)
	•	A clickable link to the issue
    Here is the data: ${JSON.stringify({ issues: formattedTasks })}
    Format each issue as a bullet point like this:
	•	Issue Title — open, assigned to username, created on YYYY-MM-DD. View issue
`,
    );
  },
});

export const assignIssue = new GameFunction({
  name: 'assign_issue',
  description: 'Assign issue to user ',
  args: [],
  executable: async (args, logger) => {
    // 硬编码组织成员
    const developerLogins = ['hunknownz', 'wfnuser'];
    console.log(`Using developers: ${developerLogins.join(', ')}`);

    const github = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // 获取仓库中未分配的 issues
    const { data: issues } = await github.rest.issues.listForRepo({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      state: 'open',
      assignee: 'none',
    });

    if (!issues || issues.length === 0) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify({
          issues: [],
        }),
      );
    }

    // 过滤掉 Pull Requests - 只保留实际的 Issues
    const actualIssues = issues.filter((issue) => !issue.pull_request);

    if (actualIssues.length === 0) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify({
          issues: [],
        }),
      );
    }

    console.log(
      `Found ${actualIssues.length} unassigned issues (excluding pull requests)`,
    );

    // 分配 issues 给开发者
    const assignments: any = [];

    for (let i = 0; i < actualIssues.length; i++) {
      const issue = actualIssues[i];

      // 均匀分配开发者
      const developerIndex = i % developerLogins.length;
      const developer = developerLogins[developerIndex];

      // 分配 issue
      const data = await github.rest.issues.update({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        issue_number: issue.number,
        assignees: [developer],
      });

      console.log('data >>>>', data);

      console.log(`Task #${issue.number} assigned to ${developer}`);

      assignments.push({
        issueNumber: issue.number,
        developer: developer,
        issueTitle: issue.title,
      });
    }

    return new ExecutableGameFunctionResponse(
      ExecutableGameFunctionStatus.Done,
      `You are given a list of issue assignments in JSON format. Each assignment includes:
    - issueNumber
    - developer
    - issueTitle

    Please generate a structured, natural language summary for each assignment in Markdown bullet point format. For each item, include:
    - The issue number (#issueNumber)
    - The issue title (in quotes)
    - The assigned developer

    Use this format:
    - Issue **#123** ("Some title") has been assigned to **username**.

    Here is the data: ${JSON.stringify({ assignments })}
`,
    );
  },
});

export const createIssue = new GameFunction({
  name: 'create_issue',
  description:
    'You are a professional project management expert, responsible for breaking down project requirements into clear GitHub issues',
  args: [
    {
      name: 'project name',
      description: 'project description',
    },
  ],
  executable: async (args, logger) => {
    const { description } = args;

    const prompt = `
    You are a professional project management expert, responsible for breaking down project requirements into clear GitHub issues.
    Based on the project description below, identify key features and break them down into appropriate tasks.
    
    Just return 3 issues is fine. Just for demo.
    
    Project Description:
    ${description}
    
    For each task, please provide:
    1. Title (short and clear)
    2. Description (including feature description, short and clear)
    3. Category (choose one from: bug, feature, documentation, enhancement)
    4. Priority (1-5, with 5 being highest)
    5. Estimated effort (1-10, with 10 being highest)
    
    Please return in JSON format, like:
    [
      {
        "title": "Implement user login functionality",
        "description": "Create a login form with email and password fields, add validation and error handling.",
        "category": "feature",
        "priority": 5,
        "estimatedEffort": 3
      },
      ...
    ]
    
    Return JSON only, without any additional explanation. No \`\`\`json\`\`\`'
    `;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1', // Default to OpenAI's standard URL
    });

    const github = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 500,
    });

    try {
      const content = completion.choices[0].message.content;

      const tasks = JSON.parse(content || '[]');

      const createdIssues: any = [];

      for (const task of tasks) {
        const issue = await github.rest.issues.create({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          title: task.title,
          body: task.description,
          labels: [
            task.category,
            `priority:${task.priority}`,
            `effort:${task.estimatedEffort}`,
          ],
        });

        console.log(
          `Created successfully: #${issue.data.number} - ${task.title}`,
        );
        createdIssues.push(issue.data);
      }

      console.log('Created issues:', createdIssues);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `You are given a list of GitHub issues in JSON format. Each issue contains:

        - number: the issue number
- title: the issue title
- url: the issue link

    Please generate a clean Markdown list. Each issue should be output as a bullet point in the following format:

     **#<issueNumber>**: "<title>". [View issue](<url>)

Here is the data: ${JSON.stringify({ issues: createdIssues })}
        `,
      );
    } catch (error) {
      console.log('error', error);
      console.log('Original response:', completion.choices[0].message.content);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        error.message,
      );
    }
  },
});
