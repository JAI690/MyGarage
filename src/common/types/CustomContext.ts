import type { Context as LambdaContext } from 'aws-lambda';

export interface CustomContext extends LambdaContext {
  authorizer?: {
    user: {
      userId: string;
      role: string;
    };
  };
}
