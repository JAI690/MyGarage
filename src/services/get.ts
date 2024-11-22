import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import type { CustomContext } from '../types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler =  async (
    event: APIGatewayProxyEvent,
    context: CustomContext
  ): Promise<APIGatewayProxyResult> => {
  try {
    const params = {
      TableName: 'Services',
    };

    const result = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "GET" 
      },
      body: JSON.stringify({ services: result.Items }),
    };
  } catch (error) {
    const typedError = error as Error;
    console.error('Error retrieving services:', typedError.message);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to retrieve services', error: typedError.message }),
    };
  }
};
