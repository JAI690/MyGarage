import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid'; // Para generar un UserID único

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Validar el cuerpo de la solicitud
    const body = JSON.parse(event.body || '{}');
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: email, password, role' }),
      };
    }

    // Buscar si el email ya existe en la tabla
    const queryParams = {
      TableName: 'Users', // Asegúrate de que coincide con el nombre de tu tabla en DynamoDB
      IndexName: 'EmailIndex', // Asegúrate de que el índice secundario global está configurado
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    };

    const queryResult = await dynamoDb.query(queryParams).promise();

    if (queryResult.Items && queryResult.Items.length > 0) {
      // Si ya existe un usuario con el mismo email
      return {
        statusCode: 409, // Conflicto
        body: JSON.stringify({ message: 'User with this email already exists' }),
      };
    }

    // Crear un nuevo usuario si no existe
    const userId = uuidv4();
    const params = {
      TableName: 'Users',
      Item: {
        UserID: userId,
        email,
        password, // En producción, deberías hashear la contraseña antes de almacenarla
        role,
        createdAt: new Date().toISOString(),
      },
    };

    await dynamoDb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User created successfully',
        user: { UserID: userId, email, role },
      }),
    };
  } catch (error) {
    // Manejar errores genéricos
    console.error('Error creating user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to create user',
        error: (error as Error).message,
      }),
    };
  }
};
