import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import type { CustomContext } from '../common/types/CustomContext';
import * as uuid from 'uuid';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Cliente','Admin'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    const { name, barcode, productCode, zone, shelf, rack, niche } = JSON.parse(event.body || '{}');

    if (!name || !barcode || !productCode || !zone || !shelf || !rack || !niche) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Todos los campos son obligatorios.' }),
      };
    }

    const newItem = {
      ProductID: uuid.v4(),
      name,
      barcode,
      productCode,
      zone,
      shelf,
      rack,
      niche,
    };

    await dynamoDb
      .put({
        TableName: 'Warehouse',
        Item: newItem,
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Producto creado exitosamente', product: newItem }),
    };
  } catch (error) {
    console.error('Error al crear producto:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al crear producto' }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
