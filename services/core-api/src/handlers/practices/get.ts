import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, Logger, buildKey, NotFoundError } from '@hotdoc-alt/lib';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger({ 
    requestId: event.requestContext.requestId 
  });

  try {
    const practiceId = event.pathParameters?.practiceId;
    
    if (!practiceId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Practice ID is required'
        })
      };
    }

    // For public access, we need to search without tenant scope
    // Try different tenant patterns or use a GSI
    const result = await dynamoDb.send(new GetCommand({
      TableName: process.env.PRACTICES_TABLE,
      Key: {
        pk: `PRACTICE#${practiceId}`,
        sk: 'meta'
      }
    }));

    if (!result.Item) {
      logger.warn('Practice not found', { practiceId });
      
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Practice not found'
        })
      };
    }

    logger.info('Practice retrieved', { practiceId });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Item)
    };
  } catch (error: any) {
    logger.error('Failed to get practice', error);

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