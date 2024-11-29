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
    const { id } = event.pathParameters || {};
    
    await dynamoDb
      .delete({
        TableName: 'Warehouse',
        Key: { ProductID: id },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Producto eliminado' }),
    };
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al eliminar producto' }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
