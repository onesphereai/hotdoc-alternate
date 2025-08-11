import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, generateId } from '../lib';

const seedData = async () => {
  const now = new Date().toISOString();

  // Seed practices
  const practices = [
    {
      practiceId: generateId('prac'),
      tenantId: 'demo-tenant-1',
      name: 'Melbourne Medical Centre',
      abn: '12345678901',
      address: {
        line1: '123 Collins Street',
        suburb: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        country: 'AU'
      },
      geo: {
        lat: -37.8136,
        lng: 144.9631
      },
      services: ['General Practice', 'Bulk Billing', 'Pathology'],
      hours: [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00' },
        { dayOfWeek: 2, openTime: '08:00', closeTime: '18:00' },
        { dayOfWeek: 3, openTime: '08:00', closeTime: '18:00' },
        { dayOfWeek: 4, openTime: '08:00', closeTime: '18:00' },
        { dayOfWeek: 5, openTime: '08:00', closeTime: '17:00' }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      practiceId: generateId('prac'),
      tenantId: 'demo-tenant-2',
      name: 'Sydney Family Clinic',
      abn: '98765432109',
      address: {
        line1: '456 George Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'AU'
      },
      geo: {
        lat: -33.8688,
        lng: 151.2093
      },
      services: ['Family Medicine', 'Pediatrics', 'Women\'s Health'],
      hours: [
        { dayOfWeek: 1, openTime: '07:30', closeTime: '19:00' },
        { dayOfWeek: 2, openTime: '07:30', closeTime: '19:00' },
        { dayOfWeek: 3, openTime: '07:30', closeTime: '19:00' },
        { dayOfWeek: 4, openTime: '07:30', closeTime: '19:00' },
        { dayOfWeek: 5, openTime: '07:30', closeTime: '17:00' },
        { dayOfWeek: 6, openTime: '08:00', closeTime: '12:00' }
      ],
      createdAt: now,
      updatedAt: now
    }
  ];

  // Insert practices
  for (const practice of practices) {
    await dynamoDb.send(new PutCommand({
      TableName: process.env.PRACTICES_TABLE || 'hotdoc-alt-practices-dev',
      Item: {
        pk: `PRACTICE#${practice.practiceId}`,
        sk: 'meta',
        ...practice,
        gsi1pk: `geo#${practice.address.postcode.substring(0, 1)}`,
        gsi1sk: `${practice.address.postcode}#${practice.practiceId}`
      }
    }));
    console.log(`Created practice: ${practice.name} (${practice.practiceId})`);
  }

  // Seed providers
  const providers = [
    {
      providerId: generateId('prov'),
      tenantId: practices[0].tenantId,
      practiceId: practices[0].practiceId,
      name: 'Dr. Sarah Johnson',
      gender: 'female' as const,
      languages: ['English'],
      specialties: ['General Practice', 'Women\'s Health'],
      sessionRules: {
        defaultSessionDuration: 15,
        defaultBreakDuration: 5
      },
      createdAt: now,
      updatedAt: now
    },
    {
      providerId: generateId('prov'),
      tenantId: practices[0].tenantId,
      practiceId: practices[0].practiceId,
      name: 'Dr. Michael Chen',
      gender: 'male' as const,
      languages: ['English', 'Mandarin'],
      specialties: ['General Practice', 'Chronic Disease Management'],
      sessionRules: {
        defaultSessionDuration: 20,
        defaultBreakDuration: 10
      },
      createdAt: now,
      updatedAt: now
    },
    {
      providerId: generateId('prov'),
      tenantId: practices[1].tenantId,
      practiceId: practices[1].practiceId,
      name: 'Dr. Emily Rodriguez',
      gender: 'female' as const,
      languages: ['English', 'Spanish'],
      specialties: ['Family Medicine', 'Pediatrics'],
      sessionRules: {
        defaultSessionDuration: 15,
        defaultBreakDuration: 5
      },
      createdAt: now,
      updatedAt: now
    }
  ];

  // Insert providers
  for (const provider of providers) {
    await dynamoDb.send(new PutCommand({
      TableName: process.env.PROVIDERS_TABLE || 'hotdoc-alt-providers-dev',
      Item: {
        pk: `PROVIDER#${provider.providerId}`,
        sk: 'meta',
        ...provider
      }
    }));
    console.log(`Created provider: ${provider.name} (${provider.providerId})`);
  }

  console.log('Seed data created successfully!');
  console.log(`Practices: ${practices.length}, Providers: ${providers.length}`);
};

// Run if called directly
if (require.main === module) {
  seedData().catch(console.error);
}

export { seedData };