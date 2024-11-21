import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { handler as getServices } from './services/get';
import { handler as createService } from './services/create';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;

    if (httpMethod === 'GET' && path === '/services') {
      return await getServices(event, context);
    } else if (httpMethod === 'POST' && path === '/services') {
      return await createService(event, context);
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Route not found' }),
      };
    }
  } catch (error) {
    const typedError = error as Error;
    console.error('Error handling request:', typedError.message);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: typedError.message }),
    };
  }
};