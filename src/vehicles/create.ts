import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../utils/authorize';
import type { CustomContext } from '../types/CustomContext';
import * as uuid from 'uuid';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Cliente'])(async (
    event: APIGatewayProxyEvent,
    context: CustomContext
  ): Promise<APIGatewayProxyResult> => {
  try {
    const data = JSON.parse(event.body || '{}');

    // Validar campos requeridos
    if (!data.make || !data.model || !data.year || data.Km || data.color) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: Make, Model, Year' }),
      };
    }

    // Extraer userId del contexto
    const userId = context.authorizer?.user.userId;
    if (!userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'User ID missing from authorization context' }),
      };
    }

    // Crear un ID único para el vehículo
    const vehicleId = uuid.v4();

    // Preparar los datos para DynamoDB
    const params = {
      TableName: 'Vehicles',
      Item: {
        VehicleID: vehicleId,
        UserID: userId,
        Make: data.make,
        Model: data.model,
        Year: data.year,
        Km: data.Km,
        Color: data.color,
        CreatedAt: new Date().toISOString(),
      },
    };

    // Guardar el vehículo en DynamoDB
    await dynamoDb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Vehicle created successfully', vehicleId }),
    };
  } catch (error) {
    const typedError = error as Error;
    console.error('Error creating vehicle:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create vehicle', error: typedError.message }),
    };
  }
});
