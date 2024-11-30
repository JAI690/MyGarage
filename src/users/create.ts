import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as bcrypt from 'bcryptjs';
import { authorize } from '../common/utils/authorize';
import { corsMiddleware } from '../common/utils/corsMiddleware';
import { v4 as uuid } from 'uuid';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = (async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const data = JSON.parse(event.body || '{}');
    const { name, email, password, role } = data;

    if (!name || !email || !password || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: name, email, password, role' }),
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuid();

    const params = {
      TableName: 'Users',
      Item: {
        UserID: userId,
        Name: name,
        Email: email,
        Role: role,
        Password: hashedPassword,
        CreatedAt: new Date().toISOString(),
      },
    };

    await dynamoDb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'User created successfully', userId }),
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create user', error: (error as Error).message }),
    };
  }
});

export const endpointHandler = corsMiddleware(handler);
