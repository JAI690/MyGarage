import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const params = {
      TableName: 'Services', // Asegúrate de que coincida con el nombre de la tabla en template.yaml
    };

    // Escanear todos los elementos en la tabla
    const result = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ services: result.Items }),
    };
  } catch (error) {
    console.error('Error retrieving services:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to retrieve services', error: error.message }),
    };
  }
};