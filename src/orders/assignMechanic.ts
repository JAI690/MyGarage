import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../utils/authorize';
import type { CustomContext } from '../types/CustomContext';
import {corsMiddleware}  from '../utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Admin'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    const data = JSON.parse(event.body || '{}');

    // Validar campos requeridos
    if (!data.orderId || !data.mechanicId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: OrderID and MechanicID' }),
      };
    }

    // Actualizar la orden
    const params = {
        TableName: 'WorkOrders',
        Key: { OrderID: data.orderId },
        UpdateExpression: 'SET #status = :status, AssignedTo = :mechanicId, UpdatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'Status', // Alias para la palabra reservada
        },
        ExpressionAttributeValues: {
          ':status': 'Assigned',
          ':mechanicId': data.mechanicId,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      };
      
    const result = await dynamoDb.update(params).promise();


    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",  
        "Access-Control-Allow-Methods": "POST" 
      },
      body: JSON.stringify({ message: 'Mechanic assigned successfully', order: result.Attributes }),
    };
  } catch (error) {
    const typedError = error as Error;
    console.error('Error assigning mechanic:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to assign mechanic', error: typedError.message }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);