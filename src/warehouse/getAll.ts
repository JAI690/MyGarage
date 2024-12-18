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
    // Fetch warehouse records
    const warehouseResult = await dynamoDb
      .scan({
        TableName: 'Warehouse',
      })
      .promise();

    const warehouseRecords = warehouseResult.Items || [];

    // Fetch all products
    const productResult = await dynamoDb
      .scan({
        TableName: 'Products',
      })
      .promise();

    const products = productResult.Items || [];

    // Map product names to warehouse records
    const enrichedRecords = warehouseRecords.map((record) => {
      const product = products.find((p) => p.ProductID === record.ProductID);
      return {
        ...record,
        productName: product?.name || 'Producto desconocido',
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(enrichedRecords),
    };
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al obtener productos' }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
