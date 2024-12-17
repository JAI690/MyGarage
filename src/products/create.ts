import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import type { CustomContext } from '../common/types/CustomContext';
import { v4 as uuid } from 'uuid';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Cliente','Admin'])(async (
    event: APIGatewayProxyEvent,
    context: CustomContext
  ): Promise<APIGatewayProxyResult> => {
  try {
    const data = JSON.parse(event.body || '{}');

    const params = {
      TableName: 'Products',
      Item: {
        ProductID: uuid(),
        name: data.name,
        barcode: data.barcode,
        productCode: data.productCode,
      },
    };

    await dynamoDb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify(params.Item),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create product' }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);