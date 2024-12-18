import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();

export const updateProductHandler = authorize(['Admin'])(async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};
    const data = JSON.parse(event.body || '{}');

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'El ID del producto es obligatorio.' }),
      };
    }

    const updateExpression = [];
    const expressionAttributeValues: Record<string, any> = {};

    if (data.name) {
      updateExpression.push('name = :name');
      expressionAttributeValues[':name'] = data.name;
    }
    if (data.barcode) {
      updateExpression.push('barcode = :barcode');
      expressionAttributeValues[':barcode'] = data.barcode;
    }
    if (data.productCode) {
      updateExpression.push('productCode = :productCode');
      expressionAttributeValues[':productCode'] = data.productCode;
    }

    if (updateExpression.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No se proporcionaron datos para actualizar.' }),
      };
    }

    await dynamoDb
      .update({
        TableName: 'Products',
        Key: { ProductID: id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW',
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Producto actualizado exitosamente.' }),
    };
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al actualizar el producto.' }),
    };
  }
});

export const endpointHandler = corsMiddleware(updateProductHandler);
