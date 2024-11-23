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
    const role = event.queryStringParameters?.role;

    if (!role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'The role query parameter is required.' }),
      };
    }

    const params = {
      TableName: 'Users',
      IndexName: 'RoleIndex',
      KeyConditionExpression: '#role = :role',
      ExpressionAttributeNames: {
        '#role': 'Role', // Alias para la palabra reservada
      },
      ExpressionAttributeValues: {
        ':role': role,
      },
    };

    const result = await dynamoDb.query(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Users retrieved successfully',
        users: result.Items,
      }),
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch users', error: (error as Error).message }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
