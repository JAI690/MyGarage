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

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'El ID del vehículo es obligatorio.' }),
      };
    }

    await dynamoDb
      .delete({
        TableName: 'Vehicles',
        Key: { VehicleID: id },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Vehículo eliminado correctamente.' }),
    };
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al eliminar vehículo.' }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
