import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { CustomContext } from '../types/CustomContext';

export const corsMiddleware = (
  handler: (event: APIGatewayProxyEvent, context: CustomContext) => Promise<APIGatewayProxyResult>
) => {
  return async (event: APIGatewayProxyEvent, context: CustomContext): Promise<APIGatewayProxyResult> => {
    // Manejar solicitudes OPTIONS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        body: '',
      };
    }

    // Ejecutar el controlador original
    const response = await handler(event, context);

    // Agregar encabezados CORS a la respuesta
    return {
      ...response,
      headers: {
        ...response.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
    };
  };
};
