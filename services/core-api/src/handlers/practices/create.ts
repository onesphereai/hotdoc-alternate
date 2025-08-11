import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { PracticeSchema } from '../../models';
import { dynamoDb, generateId, buildKey, Logger, ValidationError, extractTenantId } from '../../lib';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger({ 
    requestId: event.requestContext.requestId 
  });

  try {
    const tenantId = extractTenantId(event);
    const body = JSON.parse(event.body || '{}');
    
    const practiceId = generateId('prac');
    const now = new Date().toISOString();
    
    const practiceData = {
      ...body,
      practiceId,
      tenantId,
      createdAt: now,
      updatedAt: now
    };

    const validatedPractice = PracticeSchema.parse(practiceData);

    await dynamoDb.send(new PutCommand({
      TableName: process.env.PRACTICES_TABLE,
      Item: {
        pk: `PRACTICE#${practiceId}`,
        sk: 'meta',
        ...validatedPractice,
        gsi1pk: `geo#${validatedPractice.address.postcode.substring(0, 1)}`,
        gsi1sk: `${validatedPractice.address.postcode}#${practiceId}`
      }
    }));

    logger.info('Practice created', { practiceId, tenantId });

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validatedPractice)
    };
  } catch (error: any) {
    logger.error('Failed to create practice', error);
    
    if (error.name === 'ZodError') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Validation failed',
          details: error.errors
        })
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error'
      })
    };
  }
};