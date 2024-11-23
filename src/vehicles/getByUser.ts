import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import type { CustomContext } from '../common/types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Cliente','Admin'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = context.authorizer?.user.userId;

    const result = await dynamoDb
      .query({
        TableName: 'Vehicles',
        IndexName: 'UserIndex',
        KeyConditionExpression: 'UserID = :userId',
        ExpressionAttributeValues: { ':userId': userId },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al obtener vehículos.' }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
