import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { authorize } from '../utils/authorize';
import type { CustomContext } from '../types/CustomContext';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = authorize(['Cliente'])(async (
  event: APIGatewayProxyEvent,
  context: CustomContext
): Promise<APIGatewayProxyResult> => {
  try {
    // Extraer UserID del contexto
    const userId = context.authorizer?.user.userId;
    if (!userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'User ID missing from authorization context' }),
      };
    }

    // Configurar los parámetros de la consulta
    const params = {
      TableName: 'Vehicles',
      IndexName: 'UserIndex', // Usar el índice secundario para buscar por UserID
      KeyConditionExpression: 'UserID = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    };

    // Realizar la consulta a DynamoDB
    const result = await dynamoDb.query(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "GET" 
      },
      body: JSON.stringify({
        message: 'Vehicles retrieved successfully',
        vehicles: result.Items || [],
      }),
    };
  } catch (error) {
    const typedError = error as Error;
    console.error('Error retrieving vehicles:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to retrieve vehicles', error: typedError.message }),
    };
  }
});
