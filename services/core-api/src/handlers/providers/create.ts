import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ProviderSchema } from '../../models';
import { dynamoDb, generateId, buildKey, Logger, extractTenantId, addCorsHeaders } from '../../lib';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger({ 
    requestId: event.requestContext.requestId 
  });

  try {
    const tenantId = extractTenantId(event);
    const body = JSON.parse(event.body || '{}');
    
    const providerId = generateId('prov');
    const now = new Date().toISOString();
    
    const providerData = {
      ...body,
      providerId,
      tenantId,
      createdAt: now,
      updatedAt: now
    };

    const validatedProvider = ProviderSchema.parse(providerData);

    await dynamoDb.send(new PutCommand({
      TableName: process.env.PROVIDERS_TABLE,
      Item: {
        pk: `PROVIDER#${providerId}`,
        sk: 'meta',
        ...validatedProvider
      }
    }));

    logger.info('Provider created', { providerId, tenantId, practiceId: validatedProvider.practiceId });

    return {
      statusCode: 201,
      headers: addCorsHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(validatedProvider)
    };
  } catch (error: any) {
    logger.error('Failed to create provider', error);
    
    if (error.name === 'ZodError') {
      return {
        statusCode: 400,
        headers: addCorsHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          error: 'Validation failed',
          details: error.errors
        })
      };
    }

    return {
      statusCode: 500,
      headers: addCorsHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        error: 'Internal server error'
      })
    };
  }
};