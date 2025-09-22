import serverlessExpress from '@codegenie/serverless-express';
import app from './shared/web/App';

export const handler = serverlessExpress({ app });