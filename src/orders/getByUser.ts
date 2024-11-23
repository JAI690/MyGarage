import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import type { CustomContext } from '../common/types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Cliente'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = context.authorizer?.user.userId;

    // Obtener órdenes del cliente
    const ordersParams = {
      TableName: 'WorkOrders',
      IndexName: 'ClientIndex',
      KeyConditionExpression: 'ClientID = :clientId',
      ExpressionAttributeValues: {
        ':clientId': userId,
      },
    };

    const ordersResult = await dynamoDb.query(ordersParams).promise();
    const orders = ordersResult.Items || [];

    if (orders.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No orders found', orders: [] }),
      };
    }

    // Obtener IDs de vehículos y servicios
    const vehicleIds = [...new Set(orders.map((order) => order.VehicleID))];
    const serviceIds = [...new Set(orders.flatMap((order) => order.Services))];

    // BatchGet para vehículos
    const vehiclesResult = await dynamoDb
      .batchGet({
        RequestItems: {
          Vehicles: {
            Keys: vehicleIds.map((id) => ({ VehicleID: id })),
          },
        },
      })
      .promise();

    const vehicles = vehiclesResult.Responses?.Vehicles || [];

    // BatchGet para servicios
    const servicesResult = await dynamoDb
      .batchGet({
        RequestItems: {
          Services: {
            Keys: serviceIds.map((id) => ({ ServiceID: id })),
          },
        },
      })
      .promise();

    const services = servicesResult.Responses?.Services || [];

    // Mapear los datos adicionales
    const vehicleMap = Object.fromEntries(
      vehicles.map((vehicle) => [vehicle.VehicleID, `${vehicle.brand} ${vehicle.model}`])
    );
    const serviceMap = Object.fromEntries(
      services.map((service) => [service.ServiceID, service.name])
    );

    // Enriquecer las órdenes
    const enrichedOrders = orders.map((order) => ({
      ...order,
      VehicleName: vehicleMap[order.VehicleID] || 'Desconocido',
      ServiceNames: order.Services.map((id: string | number) => serviceMap[id] || 'Desconocido'),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Orders retrieved successfully', orders: enrichedOrders }),
    };
  } catch (error) {
    console.error('Error retrieving orders:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to retrieve orders', error: (error as Error).message }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
