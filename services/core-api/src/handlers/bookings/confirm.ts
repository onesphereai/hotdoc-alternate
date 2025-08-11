import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, Logger } from '@hotdoc-alt/lib';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger({ 
    requestId: event.requestContext.requestId 
  });

  try {
    const bookingId = event.pathParameters?.bookingId;
    const body = JSON.parse(event.body || '{}');
    
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

    // First, get the current booking
    const currentBooking = await dynamoDb.send(new GetCommand({
      TableName: process.env.BOOKINGS_TABLE,
      Key: {
        pk: `BOOKING#${bookingId}`,
        sk: 'meta'
      }
    }));

    if (!currentBooking.Item) {
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

    // Validate confirmation code if provided
    if (body.confirmationCode && 
        currentBooking.Item.confirmationCode !== body.confirmationCode) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Invalid confirmation code'
        })
      };
    }

    // Update booking status to CONFIRMED
    const result = await dynamoDb.send(new UpdateCommand({
      TableName: process.env.BOOKINGS_TABLE,
      Key: {
        pk: `BOOKING#${bookingId}`,
        sk: 'meta'
      },
      UpdateExpression: 'SET #status = :confirmed, updatedAt = :now',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':confirmed': 'CONFIRMED',
        ':now': new Date().toISOString(),
        ':pending': 'PENDING'
      },
      ConditionExpression: '#status = :pending',
      ReturnValues: 'ALL_NEW'
    }));

    logger.info('Booking confirmed', { bookingId });

    // In a real system, this would trigger a BookingConfirmed event
    // TODO: Emit event to EventBridge for reminder scheduling

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...result.Attributes,
        message: 'Booking confirmed successfully'
      })
    };
  } catch (error: any) {
    logger.error('Failed to confirm booking', error);
    
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Booking is not in pending status'
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