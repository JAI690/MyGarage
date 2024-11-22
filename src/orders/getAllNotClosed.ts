import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../utils/authorize';
import type { CustomContext } from '../types/CustomContext';
import {corsMiddleware}  from '../utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler =  authorize(['Admin'])(async (
    event: APIGatewayProxyEvent,
    context: CustomContext
  ): Promise<APIGatewayProxyResult> => {
  try {
    const params = {
      TableName: process.env.WORK_ORDERS_TABLE || "WorkOrders",
      FilterExpression: "#status <> :closed",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":closed": "cerrado",
      },
    };

    const result = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        workOrders: result.Items,
      }),
    };
  } catch (error) {
    const typedError = error as Error;
    console.error("Error fetching open work orders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error fetching open work orders",
        error: typedError.message,
      }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
