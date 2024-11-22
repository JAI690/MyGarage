import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../utils/authorize';
import type { CustomContext } from '../types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Cliente','Mechanic'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = context.authorizer?.user.userId;

    // Parámetros para consultar las órdenes del cliente
    const params = {
      TableName: 'WorkOrders',
      IndexName: 'ClientIndex',
      KeyConditionExpression: 'ClientID = :clientId',
      ExpressionAttributeValues: {
        ':clientId': userId,
      },
    };

    const result = await dynamoDb.query(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "GET" 
      },
      body: JSON.stringify({
        message: 'Orders retrieved successfully',
        orders: result.Items,
      }),
    };
  } catch (error) {
    console.error('Error retrieving orders:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to retrieve orders', error: (error as Error).message }),
    };
  }
});
