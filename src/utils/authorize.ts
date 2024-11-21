import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { CustomContext } from '../types/CustomContext';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

export const authorize = (allowedRoles: string[]) => {
  return (
    handler: (event: APIGatewayProxyEvent, context: CustomContext) => Promise<APIGatewayProxyResult>
  ) => {
    return async (event: APIGatewayProxyEvent, context: CustomContext): Promise<APIGatewayProxyResult> => {
      try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader) {
          return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Authorization header missing' }),
          };
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;

        if (!allowedRoles.includes(decoded.role)) {
          return {
            statusCode: 403,
            body: JSON.stringify({ message: 'User not authorized' }),
          };
        }

        context.authorizer = {
          user: {
            userId: decoded.userId,
            role: decoded.role,
          },
        };

        return await handler(event, context);
      } catch (error) {
        const typedError = error as Error;
        console.error('Authorization error:', typedError.message);
        return {
          statusCode: 403,
          body: JSON.stringify({ message: 'Invalid or expired token' }),
        };
      }
    };
  };
};
