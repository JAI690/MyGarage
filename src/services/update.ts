import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import type { CustomContext } from '../common/types/CustomContext';
import { corsMiddleware } from '../common/utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Admin'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};
    const body = JSON.parse(event.body || '{}');

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'El ID del servicio es obligatorio.' }),
      };
    }

    const { name, description, price, duration } = body;

    if (!name || !price || !duration) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Nombre, precio y duración son obligatorios.' }),
      };
    }

    const params = {
      TableName: 'Services',
      Key: { ServiceID: id },
      UpdateExpression:
        'SET #name = :name, #description = :description, #price = :price, #duration = :duration',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#description': 'description',
        '#price': 'price',
        '#duration': 'duration',
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':description': description || '',
        ':price': price,
        ':duration': duration,
      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoDb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Servicio con ID ${id} actualizado correctamente.`,
        updatedService: result.Attributes,
      }),
    };
  } catch (error) {
    console.error('Error actualizando servicio:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error actualizando servicio.' }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
