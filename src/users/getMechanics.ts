import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
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
    // Query to filter users by role = "Mechanic"
    const params = {
      TableName: 'Users',
      IndexName: 'RoleIndex',
      KeyConditionExpression: '#role = :role',
      ExpressionAttributeNames: {
        '#role': 'Role', // Alias para evitar conflicto con palabra reservada
      },
      ExpressionAttributeValues: {
        ':role': 'Mechanic',
      },
    };

    const result = await dynamoDb.query(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Mechanics retrieved successfully',
        users: result.Items?.map((user) => ({
          MechanicID: user.UserID,
          Name: user.Name,
        })) || [],
      }),
    };
  } catch (error) {
    console.error('Error retrieving mechanics:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to retrieve mechanics', error: (error as Error).message }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
