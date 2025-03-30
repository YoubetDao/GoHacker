import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameFunction,
} from '@virtuals-protocol/game';

export const getProjectIssue = new GameFunction({
  name: 'get_project_issue',
  description: 'Get project issue list',
  args: [
    {
      name: 'repoName',
      description: 'Repository name',
    },
  ],
  executable: async (args, logger) => {
    try {
      const response = await fetch(
        `${process.env.BACKEND_URL}/api/project/${args.repoName}/issues`,
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Failed to get project issue');
      }

      logger(`Project detail:${data.project_name},${data.issues}`);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify({
          issues: data.issues,
          project_name: data.project_name,
        }),
      );
    } catch (error) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `Failed to fetch project issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
