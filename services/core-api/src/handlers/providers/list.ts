import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, Logger, addCorsHeaders } from '../../lib';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger({ 
    requestId: event.requestContext.requestId 
  });

  try {
    const practiceId = event.queryStringParameters?.practiceId;
    
    logger.info('Listing providers', {
      table: process.env.PROVIDERS_TABLE,
      practiceId
    });

    let scanParams: any = {
      TableName: process.env.PROVIDERS_TABLE,
      FilterExpression: 'begins_with(pk, :pk)',
      ExpressionAttributeValues: {
        ':pk': 'PROVIDER#'
      }
    };
    
    if (practiceId) {
      // Filter by specific practice
      scanParams.FilterExpression += ' AND practiceId = :practiceId';
      scanParams.ExpressionAttributeValues[':practiceId'] = practiceId;
    }

    const result = await dynamoDb.send(new ScanCommand(scanParams));

    const providers = result.Items || [];
    logger.info('Found providers', { count: providers.length, practiceId });

    return {
      statusCode: 200,
      headers: addCorsHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        providers,
        count: providers.length,
        practiceId
      })
    };

  } catch (error: any) {
    logger.error('Failed to list providers', error);

    return {
      statusCode: 500,
      headers: addCorsHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};