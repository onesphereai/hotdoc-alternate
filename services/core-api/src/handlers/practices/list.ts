import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, Logger, buildKey } from '@hotdoc-alt/lib';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger({ 
    requestId: event.requestContext.requestId 
  });

  try {
    const { postcode, radiusKm = '10' } = event.queryStringParameters || {};

    if (postcode) {
      // Geographic search by postcode
      // For MVP, we'll do a simplified geo search
      // In production, this would use proper geohash bucketing
      const geoPrefix = `geo#${postcode.substring(0, 1)}`;
      
      const result = await dynamoDb.send(new QueryCommand({
        TableName: process.env.PRACTICES_TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :geoPrefix',
        ExpressionAttributeValues: {
          ':geoPrefix': geoPrefix
        },
        Limit: 20
      }));

      logger.info('Geographic search completed', { 
        postcode, 
        radiusKm, 
        count: result.Items?.length || 0 
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          practices: result.Items || [],
          count: result.Items?.length || 0,
          searchParams: { postcode, radiusKm }
        })
      };
    } else {
      // General list - return recent practices (for admin use)
      const result = await dynamoDb.send(new QueryCommand({
        TableName: process.env.PRACTICES_TABLE,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': 'PRACTICE'
        },
        ScanIndexForward: false,
        Limit: 50
      }));

      logger.info('Practice list retrieved', { count: result.Items?.length || 0 });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          practices: result.Items || [],
          count: result.Items?.length || 0
        })
      };
    }
  } catch (error: any) {
    logger.error('Failed to list practices', error);

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