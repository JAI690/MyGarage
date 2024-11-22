import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import type { CustomContext } from '../types/CustomContext';
import {corsMiddleware}  from '../utils/corsMiddleware';

const dynamoDb = new DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const handler = async (event: APIGatewayProxyEvent, context: CustomContext): Promise<APIGatewayProxyResult> => {
  try {
    const data = JSON.parse(event.body || '{}');

    if (!data.email || !data.password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email and Password are required.' }),
      };
    }

    // Obtener usuario por email
    const params = {
      TableName: 'Users',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'Email = :email',
      ExpressionAttributeValues: {
        ':email': data.email,
      },
    };

    const result = await dynamoDb.query(params).promise();

    if (result.Items && result.Items.length === 1) {
      const user = result.Items[0];

      // Validar contraseña
      const isValidPassword = await bcrypt.compare(data.password, user.Password);
      if (!isValidPassword) {
        return {
          statusCode: 401,
          body: JSON.stringify({ message: 'Invalid credentials.' }),
        };
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          UserID: user.UserID,
          Role: user.Role,
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ token }),
      };
    }

    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Invalid credentials.' }),
    };
  } catch (error) {
    console.error('Error during login:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error.' }),
    };
  }
};

export const endpointHandler = corsMiddleware(handler);