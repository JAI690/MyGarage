import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import type { CustomContext } from '../common/types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Admin'])(async (
    event: APIGatewayProxyEvent,
    context: CustomContext
  ): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required field: id' }),
      };
    }

    const params = {
      TableName: 'Users',
      Key: { UserID: userId },
    };

    await dynamoDb.delete(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User deleted successfully' }),
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to delete user', error: (error as Error).message }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
