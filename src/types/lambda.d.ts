declare module 'aws-lambda' {
    export interface Context {
      authorizer?: {
        user: {
          userId: string;
          role: string;
        };
      };
    }
  }
  