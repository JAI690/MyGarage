import { Context as LambdaContext } from 'aws-lambda';

declare module 'aws-lambda' {
  export interface Context extends LambdaContext {
    authorizer?: {
      user: {
        userId: string;
        role: string;
      };
    };
  }
}
