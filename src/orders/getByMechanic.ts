import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import type { CustomContext } from '../common/types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Mechanic'])(async (
    event: APIGatewayProxyEvent,
    context: CustomContext
  ): Promise<APIGatewayProxyResult> => {
    try {
      const mechanicId = context.authorizer?.user.userId;
  
      const params = {
        TableName: 'WorkOrders',
        IndexName: 'AssignedToIndex',
        KeyConditionExpression: 'AssignedTo = :mechanicId',
        ExpressionAttributeValues: {
          ':mechanicId': mechanicId,
        },
      };
  
      const result = await dynamoDb.query(params).promise();
  
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Orders retrieved successfully', orders: result.Items }),
      };
    } catch (error) {
      console.error('Error retrieving mechanic orders:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to retrieve mechanic orders', error: (error as Error).message }),
      };
    }
  });

export const endpointHandler = corsMiddleware(handler);
