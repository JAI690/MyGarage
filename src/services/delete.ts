import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from '@@@aws-sdk/client-dynamodb/client-dynamodb/client-dynamodb';
import { authorize } from '../common/utils/authorize';
import type { CustomContext } from '../common/types/CustomContext';
import {corsMiddleware}  from '../common/utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();


export const handler =  authorize(['Admin'])(async (
    event: APIGatewayProxyEvent,
    context: CustomContext
  ): Promise<APIGatewayProxyResult> => {
  try {
    // Obtener el ID del servicio de los parámetros de la ruta
    const { id } = event.pathParameters || {};

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "El ID del servicio es obligatorio." }),
      };
    }

    // Eliminar el servicio en DynamoDB
    const params = {
      TableName: "Services",
      Key: { ServiceID: id },
    };

    await dynamoDb.delete(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Servicio con ID ${id} eliminado correctamente.` }),
    };
  } catch (error) {
    console.error("Error eliminando servicio:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error eliminando servicio." }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
