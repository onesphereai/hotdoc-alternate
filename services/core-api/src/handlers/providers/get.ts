import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, Logger, buildKey } from '../../lib';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger({ 
    requestId: event.requestContext.requestId 
  });

  try {
    const providerId = event.pathParameters?.providerId;
    
    if (!providerId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Provider ID is required'
        })
      };
    }

    // For public access, we need to search without tenant scope
    const result = await dynamoDb.send(new GetCommand({
      TableName: process.env.PROVIDERS_TABLE,
      Key: {
        pk: `PROVIDER#${providerId}`,
        sk: 'meta'
      }
    }));

    if (!result.Item) {
      logger.warn('Provider not found', { providerId });
      
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Provider not found'
        })
      };
    }

    logger.info('Provider retrieved', { providerId });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Item)
    };
  } catch (error: any) {
    logger.error('Failed to get provider', error);

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