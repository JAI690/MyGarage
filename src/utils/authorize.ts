import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

export const authorize = (allowedRoles: string[]) => {
  return (
    handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>
  ) => {
    return async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
      try {
        // Obtener el token del encabezado Authorization
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader) {
          return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Authorization header missing' }),
          };
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;

        // Verificar si el rol del usuario está permitido
        if (!allowedRoles.includes(decoded.role)) {
          return {
            statusCode: 403,
            body: JSON.stringify({ message: 'User not authorized' }),
          };
        }

        // Agregar información del usuario al contexto para el handler
        context.authorizer = {
          user: decoded,
        };

        // Ejecutar el handler original con ambos argumentos
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
