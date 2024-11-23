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
    const params = {
      TableName: 'Users',
    };

    const result = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Users retrieved successfully',
        users: result.Items,
      }),
    };
  } catch (error) {
    console.error('Error retrieving users:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to retrieve users', error: (error as Error).message }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
