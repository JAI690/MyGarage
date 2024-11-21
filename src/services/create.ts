import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validar entrada
    if (!body.name || !body.price || !body.description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid input. Missing required fields: name, price, description.' }),
      };
    }

    const newItem = {
      TableName: 'Services', // Asegúrate de que coincida con el nombre de la tabla en template.yaml
      Item: {
        ServiceID: new Date().toISOString(), // Generar un ID único (puedes usar UUID también)
        name: body.name,
        price: body.price,
        description: body.description,
        createdAt: new Date().toISOString(),
      },
    };

    // Insertar en DynamoDB
    await dynamoDb.put(newItem).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Service created successfully', service: newItem.Item }),
    };
  } catch (error) {
    console.error('Error creating service:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create service', error: error.message }),
    };
  }
};
