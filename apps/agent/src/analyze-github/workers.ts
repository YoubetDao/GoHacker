import { GameWorker } from '@virtuals-protocol/game';
import { getProjectIssue } from './function';

export const workerExample = new GameWorker({
  id: 'get_project_detail',
  name: 'Get Project Detail',
  description: 'Get project issue list',
  functions: [getProjectIssue],
});
