import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Admin'])(async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};
    const data = JSON.parse(event.body || '{}');

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'El ID del registro es obligatorio.' }),
      };
    }

    const updateExpression = [];
    const expressionAttributeValues: Record<string, any> = {};

    if (data.zone) {
      updateExpression.push('zone = :zone');
      expressionAttributeValues[':zone'] = data.zone;
    }
    if (data.shelf) {
      updateExpression.push('shelf = :shelf');
      expressionAttributeValues[':shelf'] = data.shelf;
    }
    if (data.rack) {
      updateExpression.push('rack = :rack');
      expressionAttributeValues[':rack'] = data.rack;
    }
    if (data.niche) {
      updateExpression.push('niche = :niche');
      expressionAttributeValues[':niche'] = data.niche;
    }

    if (updateExpression.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No se proporcionaron datos para actualizar.' }),
      };
    }

    await dynamoDb
      .update({
        TableName: 'Warehouse',
        Key: { WarehouseID: id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW',
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Registro actualizado exitosamente.' }),
    };
  } catch (error) {
    console.error('Error al actualizar registro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al actualizar el registro.' }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
