import type { Context as LambdaContext } from 'aws-lambda';

export interface CustomAuthorizerContext {
  user: {
    userId: string;
    role: string;
  };
}

// Extendemos el tipo Context de forma segura sin referencias circulares
declare module 'aws-lambda' {
  export interface Context extends LambdaContext {
    authorizer?: CustomAuthorizerContext;
  }
}
