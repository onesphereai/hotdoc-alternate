import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { BookingSchema } from '@hotdoc-alt/models';
import { dynamoDb, generateId, Logger } from '@hotdoc-alt/lib';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger({ 
    requestId: event.requestContext.requestId 
  });

  try {
    const body = JSON.parse(event.body || '{}');
    const idempotencyKey = event.headers['idempotency-key'] || generateId('idem');
    
    const bookingId = generateId('book');
    const now = new Date().toISOString();
    
    const bookingData = {
      ...body,
      bookingId,
      tenantId: body.slotRef?.practiceId || 'public',
      status: 'PENDING',
      confirmationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: now,
      updatedAt: now
    };

    const validatedBooking = BookingSchema.parse(bookingData);

    // Check if slot is still available (simplified for MVP)
    const slotCheck = await dynamoDb.send(new GetCommand({
      TableName: process.env.SESSIONS_TABLE,
      Key: {
        pk: `PRACTICE#${validatedBooking.slotRef.practiceId}#SESSIONS`,
        sk: validatedBooking.slotRef.start.split('T')[0]
      }
    }));

    if (!slotCheck.Item) {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Slot no longer available'
        })
      };
    }

    // Create booking with idempotency
    await dynamoDb.send(new PutCommand({
      TableName: process.env.BOOKINGS_TABLE,
      Item: {
        pk: `BOOKING#${bookingId}`,
        sk: 'meta',
        idempotencyKey,
        ...validatedBooking,
        gsi1pk: `PRACTICE#${validatedBooking.slotRef.practiceId}`,
        gsi1sk: validatedBooking.slotRef.start
      },
      ConditionExpression: 'attribute_not_exists(pk)'
    }));

    // Mark slot as booked (simplified - in production would be more atomic)
    // This is a placeholder - proper slot reservation would happen here

    logger.info('Booking created', { 
      bookingId, 
      practiceId: validatedBooking.slotRef.practiceId,
      providerId: validatedBooking.slotRef.providerId,
      slotTime: validatedBooking.slotRef.start
    });

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...validatedBooking,
        message: 'Booking created successfully. Please check your email for confirmation.'
      })
    };
  } catch (error: any) {
    logger.error('Failed to create booking', error);
    
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Duplicate booking request'
        })
      };
    }
    
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