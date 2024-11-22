import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
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
    if (!data.vehicleId || !data.services || data.services.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: VehicleID and Services' }),
      };
    }

    // Extraer ClientID del contexto
    const clientId = context.authorizer?.user.userId;

    // Validar que el vehículo pertenece al cliente
    const vehicleParams = {
      TableName: 'Vehicles',
      Key: { VehicleID: data.vehicleId },
    };

    const vehicle = await dynamoDb.get(vehicleParams).promise();
    if (!vehicle.Item || vehicle.Item.UserID !== clientId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Unauthorized: Vehicle does not belong to the user' }),
      };
    }

    // Crear una nueva orden de servicio
    const orderId = uuid.v4();
    const params = {
      TableName: 'WorkOrders',
      Item: {
        OrderID: orderId,
        ClientID: clientId,
        VehicleID: data.vehicleId,
        Services: data.services,
        Status: 'Pending',
        Notes: data.notes || null,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      },
    };

    // Guardar la orden en DynamoDB
    await dynamoDb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Work order created successfully', orderId }),
    };
  } catch (error) {
    const typedError = error as Error;
    console.error('Error creating work order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create work order', error: typedError.message }),
    };
  }
});
