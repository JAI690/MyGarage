import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../utils/authorize';
import type { CustomContext } from '../types/CustomContext';
import * as uuid from 'uuid';
import {corsMiddleware}  from '../utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Cliente'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = context.authorizer?.user.userId;

    const data = JSON.parse(event.body || '{}');

    // Validar campos requeridos
    if (!data.vehicleId || !Array.isArray(data.services) || data.services.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: vehicleId, services' }),
      };
    }

    // Validar que los servicios existen en la tabla Services
    const serviceIds = data.services;
    const serviceValidationParams = {
      TableName: 'Services',
      RequestItems: {
        'Services': {
          Keys: serviceIds.map((id: string) => ({ ServiceID: id }))
        }
      }
    };

    const serviceValidationResult = await dynamoDb.batchGet(serviceValidationParams).promise();

    if (
      !serviceValidationResult.Responses?.Services ||
      serviceValidationResult.Responses.Services.length !== serviceIds.length
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'One or more services are invalid',
          invalidServices: serviceIds.filter(
            (id: string) => !serviceValidationResult.Responses?.Services.some((s) => s.ServiceID === id)
          ),
        }),
      };
    }

    // Crear una nueva orden
    const orderId = uuid.v4();
    const params = {
      TableName: 'WorkOrders',
      Item: {
        WorkOrderID: orderId,
        ClientID: userId,
        VehicleID: data.vehicleId,
        Services: serviceIds,
        Status: 'Pending',
        CreatedAt: new Date().toISOString(),
      },
    };

    await dynamoDb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Order created successfully', orderId }),
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create order', error: (error as Error).message }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);