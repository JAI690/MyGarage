import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../utils/authorize';
import type { CustomContext } from '../types/CustomContext';

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
      UpdateExpression: 'SET AssignedTo = :mechanicId, Status = :status, UpdatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':mechanicId': data.mechanicId,
        ':status': 'Assigned',
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoDb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Mechanic assigned successfully', order: result.Attributes }),
    };
  } catch (error) {
    console.error('Error assigning mechanic:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to assign mechanic', error: error.message }),
    };
  }
});
