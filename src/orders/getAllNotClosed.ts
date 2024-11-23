import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import type { CustomContext } from '../common/types/CustomContext';
import {corsMiddleware}  from '../common/utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler =  authorize(['Admin'])(async (
    event: APIGatewayProxyEvent,
    context: CustomContext
  ): Promise<APIGatewayProxyResult> => {
  try {
    const params = {
      TableName: process.env.WORK_ORDERS_TABLE || "WorkOrders",
      FilterExpression: "#status <> :closed",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":closed": "cerrado",
      },
    };

    const ordersResult = await dynamoDb.scan(params).promise();
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
      body: JSON.stringify({
        workOrders: enrichedOrders
      }),
    };
  } catch (error) {
    const typedError = error as Error;
    console.error("Error fetching open work orders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error fetching open work orders",
        error: typedError.message,
      }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
