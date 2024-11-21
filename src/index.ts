import { APIGatewayProxyHandler } from 'aws-lambda';
import { getServices } from './services/get';
import { createService } from './services/create';

export const handler: APIGatewayProxyHandler = async (event, context) => {
  try {
    // Parse the HTTP method and path from the event
    const { httpMethod, path } = event;

    // Routing based on HTTP method and path
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
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
