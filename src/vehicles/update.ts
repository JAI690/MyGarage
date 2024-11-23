import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import type { CustomContext } from '../common/types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Cliente', 'Admin'])(async (
    event: APIGatewayProxyEvent,
    context: CustomContext
  ): Promise<APIGatewayProxyResult> => {
    try {
      const { id } = event.pathParameters || {};
      const { brand, model, year, plates } = JSON.parse(event.body || '{}');
  
      if (!id || !brand || !model || !year || !plates) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Todos los campos son obligatorios.' }),
        };
      }
  
      const updateExpression =
        'SET brand = :brand, model = :model, #yr = :year, plates = :plates';
  
      const expressionAttributeValues = {
        ':brand': brand,
        ':model': model,
        ':year': year,
        ':plates': plates,
      };
  
      const expressionAttributeNames = {
        '#yr': 'year', // Alias para evitar el conflicto con la palabra reservada
      };
  
      await dynamoDb
        .update({
          TableName: 'Vehicles',
          Key: { VehicleID: id },
          UpdateExpression: updateExpression,
          ExpressionAttributeValues: expressionAttributeValues,
          ExpressionAttributeNames: expressionAttributeNames,
        })
        .promise();
  
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Vehículo actualizado correctamente.' }),
      };
    } catch (error) {
      console.error('Error actualizando vehículo:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error al actualizar vehículo.' }),
      };
    }
  });
  
export const endpointHandler = corsMiddleware(handler);
  