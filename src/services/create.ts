import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from '@@aws-sdk/client-dynamodb/client-dynamodb';
import { authorize } from '../common/utils/authorize';
import type { CustomContext } from '../common/types/CustomContext';
import * as uuid from 'uuid';
import {corsMiddleware}  from '../common/utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler =  authorize(['Admin'])(async (
    event: APIGatewayProxyEvent,
    context: CustomContext
  ): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');

    if (!body.name || !body.price || !body.description || !body.duration) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: name, price' }),
      };
    }

    const serviceId = uuid.v4();
    const newItem = {
      TableName: 'Services',
      Item: {
        ServiceID: serviceId,
        name: body.name,
        price: body.price,
        description: body.description,
        duration: body.duration,
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
});

export const endpointHandler = corsMiddleware(handler);