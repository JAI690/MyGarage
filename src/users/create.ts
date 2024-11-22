import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs'; // Importa bcryptjs para hashear contraseñas
import { isValidEmail } from '../utils/extras';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: email, password, role' }),
      };
    }

    // Verificar que si es un correo correcto
    if (!isValidEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid email format.' }),
      };
    }

    // Verificar si el email ya existe
    const queryParams = {
      TableName: 'Users',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'Email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    };

    const queryResult = await dynamoDb.query(queryParams).promise();
    if (queryResult.Items && queryResult.Items.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'User with this email already exists' }),
      };
    }

    // Hashear la contraseña
    const hashedPassword = bcrypt.hashSync(password, 10); // 10 es el factor de costo recomendado

    // Crear un nuevo usuario
    const userId = uuidv4();
    const params = {
      TableName: 'Users',
      Item: {
        UserID: userId,
        Email: email,
        Password: hashedPassword, // Almacena la contraseña hasheada
        Role: role,
        createdAt: new Date().toISOString(),
      },
    };

    await dynamoDb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User created successfully',
        headers: {
          "Access-Control-Allow-Headers" : "Content-Type",
          "Access-Control-Allow-Origin": "*", 
          "Access-Control-Allow-Methods": "POST" 
        },
        user: { UserID: userId, email, role },
      }),
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create user', error: (error as Error).message }),
    };
  }
};
