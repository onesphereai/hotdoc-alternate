import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as events from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface HotdocCoreStackProps extends cdk.StackProps {
  environment: string;
}

export class HotdocCoreStack extends cdk.Stack {
  public readonly practicesTable: dynamodb.Table;
  public readonly providersTable: dynamodb.Table;
  public readonly adminUserPool: cognito.UserPool;
  public readonly patientUserPool: cognito.UserPool;

  constructor(scope: Construct, id: string, props: HotdocCoreStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'DataEncryptionKey', {
      description: `KMS key for HotDoc-Alt ${environment} data encryption`,
      enableKeyRotation: true,
    });

    new kms.Alias(this, 'DataEncryptionKeyAlias', {
      aliasName: `alias/hotdoc-alt-${environment}`,
      targetKey: encryptionKey,
    });

    // S3 Bucket for assets
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `hotdoc-alt-assets-${environment}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // DynamoDB Tables
    this.practicesTable = new dynamodb.Table(this, 'PracticesTable', {
      tableName: `hotdoc-alt-practices-${environment}`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    this.practicesTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
    });

    this.providersTable = new dynamodb.Table(this, 'ProvidersTable', {
      tableName: `hotdoc-alt-providers-${environment}`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: `hotdoc-alt-sessions-${environment}`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    sessionsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
    });

    const bookingsTable = new dynamodb.Table(this, 'BookingsTable', {
      tableName: `hotdoc-alt-bookings-${environment}`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    bookingsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
    });

    const patientsTable = new dynamodb.Table(this, 'PatientsTable', {
      tableName: `hotdoc-alt-patients-${environment}`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const recallsTable = new dynamodb.Table(this, 'RecallsTable', {
      tableName: `hotdoc-alt-recalls-${environment}`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    const eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: `hotdoc-alt-events-${environment}`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl',
    });

    // Cognito User Pools
    this.patientUserPool = new cognito.UserPool(this, 'PatientUserPool', {
      userPoolName: `hotdoc-alt-patients-${environment}`,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
        phoneNumber: { required: false, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    this.adminUserPool = new cognito.UserPool(this, 'AdminUserPool', {
      userPoolName: `hotdoc-alt-admins-${environment}`,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
      },
      customAttributes: {
        tenantId: new cognito.StringAttribute({ mutable: false }),
        role: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    // Cognito User Pool Clients
    const patientUserPoolClient = new cognito.UserPoolClient(this, 'PatientUserPoolClient', {
      userPool: this.patientUserPool,
      userPoolClientName: `hotdoc-alt-patient-client-${environment}`,
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      authFlows: {
        userSrp: true,
      },
      preventUserExistenceErrors: true,
    });

    const adminUserPoolClient = new cognito.UserPoolClient(this, 'AdminUserPoolClient', {
      userPool: this.adminUserPool,
      userPoolClientName: `hotdoc-alt-admin-client-${environment}`,
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(1),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      authFlows: {
        userSrp: true,
      },
      preventUserExistenceErrors: true,
    });

    // EventBridge Event Bus
    const eventBus = new events.EventBus(this, 'EventBus', {
      eventBusName: `hotdoc-alt-events-${environment}`,
    });

    // SQS Queues
    const bookingDLQ = new sqs.Queue(this, 'BookingDLQ', {
      queueName: `hotdoc-alt-bookings-dlq-${environment}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const bookingQueue = new sqs.Queue(this, 'BookingQueue', {
      queueName: `hotdoc-alt-bookings-${environment}`,
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.minutes(5),
      deadLetterQueue: {
        queue: bookingDLQ,
        maxReceiveCount: 3,
      },
    });

    const notificationDLQ = new sqs.Queue(this, 'NotificationDLQ', {
      queueName: `hotdoc-alt-notifications-dlq-${environment}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const notificationQueue = new sqs.Queue(this, 'NotificationQueue', {
      queueName: `hotdoc-alt-notifications-${environment}`,
      retentionPeriod: cdk.Duration.days(4),
      visibilityTimeout: cdk.Duration.minutes(1),
      deadLetterQueue: {
        queue: notificationDLQ,
        maxReceiveCount: 3,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'AdminUserPoolId', {
      value: this.adminUserPool.userPoolId,
      description: 'Admin User Pool ID',
      exportName: `HotdocAlt-${environment}-AdminUserPoolId`,
    });

    new cdk.CfnOutput(this, 'AdminUserPoolClientId', {
      value: adminUserPoolClient.userPoolClientId,
      description: 'Admin User Pool Client ID',
      exportName: `HotdocAlt-${environment}-AdminUserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'PatientUserPoolId', {
      value: this.patientUserPool.userPoolId,
      description: 'Patient User Pool ID',
      exportName: `HotdocAlt-${environment}-PatientUserPoolId`,
    });

    new cdk.CfnOutput(this, 'PatientUserPoolClientId', {
      value: patientUserPoolClient.userPoolClientId,
      description: 'Patient User Pool Client ID',
      exportName: `HotdocAlt-${environment}-PatientUserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'PracticesTableName', {
      value: this.practicesTable.tableName,
      description: 'Practices DynamoDB Table Name',
      exportName: `HotdocAlt-${environment}-PracticesTable`,
    });

    new cdk.CfnOutput(this, 'ProvidersTableName', {
      value: this.providersTable.tableName,
      description: 'Providers DynamoDB Table Name',
      exportName: `HotdocAlt-${environment}-ProvidersTable`,
    });
  }
}