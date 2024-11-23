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
    const data = JSON.parse(event.body || '{}');
    const { name, email, role } = data;

    if (!userId || !name || !email || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: id, name, email, role' }),
      };
    }

    const params = {
      TableName: 'Users',
      Key: { UserID: userId },
      UpdateExpression: 'SET Name = :name, Email = :email, Role = :role',
      ExpressionAttributeValues: {
        ':name': name,
        ':email': email,
        ':role': role,
      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoDb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User updated successfully', user: result.Attributes }),
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update user', error: (error as Error).message }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
