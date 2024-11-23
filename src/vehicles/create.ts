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
    const { brand, model, year, plates } = JSON.parse(event.body || '{}');
    const userId = event.requestContext.authorizer?.principalId;

    if (!brand || !model || !year || !plates) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Todos los campos son obligatorios.' }),
      };
    }

    const vehicleId = `${userId}-${Date.now()}`;
    const newVehicle = { VehicleID: vehicleId, UserID: userId, brand, model, year, plates };

    await dynamoDb
      .put({
        TableName: 'Vehicles',
        Item: newVehicle,
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify(newVehicle),
    };
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al crear vehículo.' }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
