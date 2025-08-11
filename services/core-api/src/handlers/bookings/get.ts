import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, Logger } from '@hotdoc-alt/lib';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger({ 
    requestId: event.requestContext.requestId 
  });

  try {
    const bookingId = event.pathParameters?.bookingId;
    
    if (!bookingId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Booking ID is required'
        })
      };
    }

    const result = await dynamoDb.send(new GetCommand({
      TableName: process.env.BOOKINGS_TABLE,
      Key: {
        pk: `BOOKING#${bookingId}`,
        sk: 'meta'
      }
    }));

    if (!result.Item) {
      logger.warn('Booking not found', { bookingId });
      
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Booking not found'
        })
      };
    }

    logger.info('Booking retrieved', { bookingId });

    // Remove sensitive internal fields
    const { idempotencyKey, ...publicBooking } = result.Item;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(publicBooking)
    };
  } catch (error: any) {
    logger.error('Failed to get booking', error);

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