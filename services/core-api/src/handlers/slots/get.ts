import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, Logger } from '../../lib';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger({ 
    requestId: event.requestContext.requestId 
  });

  try {
    const { practiceId, providerId, from, to } = event.queryStringParameters || {};
    
    if (!practiceId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'practiceId is required'
        })
      };
    }

    const fromDate = from || new Date().toISOString().split('T')[0];
    const toDate = to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let keyConditionExpression = 'pk = :practiceKey AND sk BETWEEN :fromDate AND :toDate';
    let expressionAttributeValues: any = {
      ':practiceKey': `PRACTICE#${practiceId}#SESSIONS`,
      ':fromDate': fromDate,
      ':toDate': toDate
    };

    // If providerId is specified, filter further
    if (providerId) {
      keyConditionExpression += ' AND contains(sk, :providerId)';
      expressionAttributeValues[':providerId'] = providerId;
    }

    const result = await dynamoDb.send(new QueryCommand({
      TableName: process.env.SESSIONS_TABLE,
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: 'available = :available',
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
        ':available': true
      }
    }));

    // Transform session data into individual slots
    const slots = [];
    for (const session of result.Items || []) {
      if (session.slots && Array.isArray(session.slots)) {
        for (const slot of session.slots) {
          if (slot.available) {
            slots.push({
              slotId: `${session.sessionId}_${slot.start}`,
              providerId: session.providerId,
              practiceId: session.practiceId,
              start: `${session.date}T${slot.start}:00.000Z`,
              end: `${session.date}T${slot.end}:00.000Z`,
              apptTypeCode: slot.apptTypeCode || 'standard',
              available: true
            });
          }
        }
      }
    }

    logger.info('Slots retrieved', { 
      practiceId, 
      providerId, 
      fromDate, 
      toDate, 
      slotCount: slots.length 
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        slots,
        count: slots.length,
        searchParams: { practiceId, providerId, from: fromDate, to: toDate }
      })
    };
  } catch (error: any) {
    logger.error('Failed to get slots', error);

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