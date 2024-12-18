import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();

export const deleteProductHandler = authorize(['Admin'])(async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'El ID del producto es obligatorio.' }),
      };
    }

    await dynamoDb
      .delete({
        TableName: 'Products',
        Key: { ProductID: id },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Producto eliminado exitosamente.' }),
    };
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al eliminar el producto.' }),
    };
  }
});

export const endpointHandler = corsMiddleware(deleteProductHandler);
