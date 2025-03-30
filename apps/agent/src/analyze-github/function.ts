import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameFunction,
} from '@virtuals-protocol/game';
import { Octokit } from 'octokit';

export const getProjectIssue = new GameFunction({
  name: 'get_project_issue',
  description: 'Get github project issue',
  args: [
    // {
    //   name: 'repoName',
    //   description: 'Repository name',
    // },
  ],
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

    return new ExecutableGameFunctionResponse(
      ExecutableGameFunctionStatus.Done,
      JSON.stringify({
        issues: formattedTasks,
      }),
    );
  },
});

export const assignIssue = new GameFunction({
  name: 'assign_issue',
  description: 'Assign issue to user',
  args: [
    {
      name: 'issueId',
      description: 'Issue id',
    },
    {
      name: 'assignee',
      description: 'Assignee',
    },
  ],
  executable: async (args, logger) => {
    const { issueId, assignee } = args;

    const github = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const result = await github.rest.issues.update({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      issue_number: issueId,
      assignees: [assignee],
    });

    logger(`Assigned issue ${issueId} to ${assignee}`);

    return new ExecutableGameFunctionResponse(
      ExecutableGameFunctionStatus.Done,
      JSON.stringify({
        issueId,
        assignee,
      }),
    );
  },
});

export const createIssue = new GameFunction({
  name: 'create_issue',
  description: 'Create new issue',
  args: [
    {
      name: 'title',
      description: 'Issue title',
    },
    {
      name: 'body',
      description: 'Issue body',
    },
  ],
  executable: async (args, logger) => {
    const { title, body } = args;

    const github = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const result = await github.rest.issues.create({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      title,
      body,
    });

    logger(`Created issue: ${result.data.title}`);

    return new ExecutableGameFunctionResponse(
      ExecutableGameFunctionStatus.Done,
      JSON.stringify({
        title,
        body,
      }),
    );
  },
});
