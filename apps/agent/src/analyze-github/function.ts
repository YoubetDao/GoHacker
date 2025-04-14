import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameFunction,
} from '@virtuals-protocol/game';
import { Octokit } from 'octokit';
import OpenAI from 'openai';
import { SDK, SdkCtorOptions } from 'youbet-sdk';

export const getProjectIssue = new GameFunction({
  name: 'get_project_task',
  description: `Query tasks from a GitHub repository and return a structured list of tasks, including the following fields for each task: title, status (open or closed), category (e.g., bug, enhancement), and assignee (username or null if unassigned).`,
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

export const allocateIssue = new GameFunction({
  name: 'allocate_task',
  description: 'Allocate task on GitHub to developers. 分配任务给开发者。',
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
  name: 'create_task',
  description:
    'You are a professional project management expert, responsible for breaking down project requirements into clear GitHub tasks.',
  args: [
    {
      name: 'description',
      description: 'project description',
    },
  ],
  executable: async (args, logger) => {
    const { description } = args;

    const prompt = `
    You are a professional project management expert, responsible for breaking down project requirements into clear GitHub issues.
    Based on the project description below, identify key features and break them down into appropriate tasks.
    
    Just return 2 issues is fine. Just for demo.
    
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

export const listProjects = new GameFunction({
  name: 'list_projects',
  description:
    'You are given a list of hackathon project GitHub repositories. For each project, analyze the idea based on the description and evaluate the code quality based on the GitHub repo (e.g. innovation, feasibility, technical complexity, completion, market potential).',
  args: [],
  executable: async (args, logger) => {
    try {
      const response = await fetch(
        `${process.env.BACKEND_URL}/v1/github-repos?offset=0&limit=10`,
      );
      const data = await response.json();

      if (data.status !== 'success') {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          'Failed to judge projects',
        );
      }

      const repos = data.data.repos;

      if (repos.length === 0) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          'No projects found',
        );
      }

      // const opSepoliaOptions: SdkCtorOptions = {
      //   networkOptions: {
      //     rpcUrl: 'https://sepolia.optimism.io',
      //     chainId: 11155420,
      //     contractAddress: '0x411d99703453e5A49a2E57d5b7B97Dc1f8E3715b',
      //   },
      //   chainName: 'Optimism Sepolia',
      //   privateKey: process.env.YOUBET_PRIVATE_KEY,
      // };

      // const youbetsdk = new SDK(opSepoliaOptions);

      // await youbetsdk.contract.donateToProject('957405603', '0.001');

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `You are given a list of GitHub repositories in JSON format. Each object contains:

      - htmlUrl: the URL of the GitHub repository
      - fullName: the repository full name (e.g., "owner/repo")
      - description: a short description of the project
      - score: a numeric score representing project ranking

      Please generate a Markdown-formatted list of these projects. For each project, use the following format:

      ### 🔗 [<fullName>](<htmlUrl>)

      **Score**: <score>  
      **Description**: <description>

      If description is missing or null, just write "No description provided."
      Here is the data: ${JSON.stringify({ repos })}

      Finally, return the all projects leaderboard - https://deepflow-hip.vercel.app/ to the user.
      `,
      );
    } catch (error) {
      console.log('Original response:', error.message);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        error.message,
      );
    }
  },
});

// 获取项目中每个贡献者的贡献比例，然后调用合约接口进行奖励
export const distributeReward = new GameFunction({
  name: 'distribute_reward',
  description:
    "Distribute reward to a repository's contributors with the amount of reward",
  args: [
    {
      name: 'repo',
      description: 'GitHub repository URL (e.g. https://github.com/owner/repo)',
    },
    {
      name: 'amount',
      description: 'The amount of reward to distribute',
      type: 'number',
    },
  ],
  executable: async (args, logger) => {
    const { repo, amount } = args;

    // 确保 amount 是数字类型
    const rewardAmount = Number(amount);
    if (isNaN(rewardAmount)) {
      throw new Error('Amount must be a valid number');
    }

    const response = await fetch(
      `http://124.221.119.233:5200/v1/github-repos/eval-contributions?repo=${repo}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch contributor data: ${response.statusText}`,
      );
    }

    const result = await response.json();

    if (result.status !== 'success') {
      throw new Error(
        'Failed to fetch contributor data: API returned non-success status',
      );
    }

    const contributors = result.data.contributors;
    console.log('contributors', contributors);

    // 计算出每个贡献者的奖励金额，放入contributors的reward字段
    contributors.forEach((contributor) => {
      // 将ratio从字符串转换为数字（去掉百分号并除以100）
      const ratio = parseFloat(contributor.ratio) / 100;
      contributor.reward = rewardAmount * ratio;
    });

    return new ExecutableGameFunctionResponse(
      ExecutableGameFunctionStatus.Done,
      `You are given a list of GitHub contributors in JSON format. Each contributor contains:

      - login: the contributor's username
      - contributions: the number of contributions
      - ratio: the ratio of contributions to the total contributions (in percentage)
      - avatarUrl: the contributor's avatar URL
      - htmlUrl: the contributor's GitHub profile URL
      - reward: the calculated reward amount based on contribution ratio, Unit is USDT

      Here is the data: ${JSON.stringify({ contributors })}
      `,
    );
  },
});

export const analyzeProject = new GameFunction({
  name: 'analyze_project',
  description:
    'Analyze a specific GitHub project and provide detailed metrics and evaluation.',
  args: [
    {
      name: 'repo_url',
      description: 'GitHub repository URL (e.g. https://github.com/owner/repo)',
    },
  ],
  executable: async (args, logger) => {
    const { repo_url } = args;

    if (!repo_url) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        'Repo URL is required',
      );
    }

    try {
      console.log(repo_url);

      // 获取项目列表
      const response = await fetch(
        `${process.env.BACKEND_URL}/v1/github-repos?offset=0&limit=10`,
      );
      const data = await response.json();

      if (data.status !== 'success') {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          'Failed to fetch projects',
        );
      }

      const project = data.data.repos.find((repo) =>
        repo.htmlUrl.toLowerCase().includes(repo_url.toLowerCase()),
      );

      if (!project) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          'Project not found in the list',
        );
      }

      const analysisResult = [
        {
          type: 'html',
          content: `<p><strong>Project Analysis: ${project.fullName}</strong></p>
<p>${project.description || 'No description provided.'}</p>`,
        },
        {
          type: 'chart',
          title: 'Project Score Analysis',
          data: [
            {
              key: 'Innovation',
              value: Math.max(Math.min(Math.round(project.score * 10), 100), 0),
            },
            {
              key: 'Feasibility',
              value: Math.max(Math.min(Math.round(project.score * 9), 100), 0),
            },
            {
              key: 'Technical Complexity',
              value: Math.max(Math.min(Math.round(project.score * 8), 100), 0),
            },
            {
              key: 'Completion',
              value: Math.max(Math.min(Math.round(project.score * 6.2), 100), 0),
            },
            {
              key: 'Market Potential',
              value: Math.max(Math.min(Math.round(project.score * 8.5), 100), 0),
            },
          ],
        },
        {
          type: 'html',
          content: `<p><strong>Overall Analysis:</strong> The project has achieved an overall score of ${project.score.toFixed(2)} out of 10. </p>`,
        },
      ];

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify(analysisResult),
      );
    } catch (error) {
      console.error('Error analyzing project:', error);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        error.message,
      );
    }
  },
});
