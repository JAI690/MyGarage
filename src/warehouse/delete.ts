import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import type { CustomContext } from '../common/types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Admin'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'ID es requerido' }),
      };
    }

    await dynamoDb
      .delete({
        TableName: 'Warehouse',
        Key: { WarehouseID: id },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Registro eliminado correctamente' }),
    };
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al eliminar el registro' }),
    };
  }
});


export const endpointHandler = corsMiddleware(handler);
