import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import type { CustomContext } from '../common/types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Admin', 'Cliente'])(async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const params = {
      TableName: 'Products',
    };

    const result = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Productos obtenidos exitosamente.',
        data: result.Items || [],
      }),
    };
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error al obtener productos.',
        error: (error as Error).message
      }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
