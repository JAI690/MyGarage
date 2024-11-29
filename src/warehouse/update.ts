import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import type { CustomContext } from '../common/types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Cliente','Admin'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};
    const { name, barcode, productCode, zone, shelf, rack, niche } = JSON.parse(event.body || '{}');

    if (!name || !barcode || !productCode || !zone || !shelf || !rack || !niche) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Todos los campos son obligatorios.' }),
      };
    }

    const updatedItem = {
      TableName: 'Warehouse',
      Key: { ProductID: id },
      UpdateExpression:
        'SET name = :name, barcode = :barcode, productCode = :productCode, zone = :zone, shelf = :shelf, rack = :rack, niche = :niche',
      ExpressionAttributeValues: {
        ':name': name,
        ':barcode': barcode,
        ':productCode': productCode,
        ':zone': zone,
        ':shelf': shelf,
        ':rack': rack,
        ':niche': niche,
      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoDb.update(updatedItem).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Producto actualizado', product: result.Attributes }),
    };
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al actualizar producto' }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
