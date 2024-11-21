import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler =  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');

    if (!body.name || !body.price) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: name, price' }),
      };
    }

    const newItem = {
      TableName: 'Services',
      Item: {
        ServiceID: new Date().toISOString(),
        name: body.name,
        price: body.price,
        createdAt: new Date().toISOString(),
      },
    };

    await dynamoDb.put(newItem).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Service created successfully', service: newItem.Item }),
    };
  } catch (error) {
    const typedError = error as Error;
    console.error('Error creating service:', typedError.message);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create service', error: typedError.message }),
    };
  }
};
