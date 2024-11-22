import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../utils/authorize';
import type { CustomContext } from '../types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Admin', 'Mechanic'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    const data = JSON.parse(event.body || '{}');

    // Validar campos requeridos
    if (!data.orderId || !data.status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: OrderID and Status' }),
      };
    }

    // Validar estados permitidos
    const validStatuses = ['In Progress', 'Completed'];
    if (!validStatuses.includes(data.status)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid status' }),
      };
    }

    // Actualizar la orden
    const params = {
        TableName: 'WorkOrders',
        Key: { OrderID: data.orderId },
        UpdateExpression: 'SET #status = :status, UpdatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'Status', // Alias para la palabra reservada 'Status'
        },
        ExpressionAttributeValues: {
          ':status': 'Assigned',
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoDb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Order status updated successfully', order: result.Attributes }),
    };
  } catch (error) {
    const typedError = error as Error;
    console.error('Error updating order status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update order status', error: typedError.message }),
    };
  }
});
