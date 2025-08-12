#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { HotdocCoreStack } from '../lib/hotdoc-core-stack';
import { HotdocApiStack } from '../lib/hotdoc-api-stack';
import { HotdocFrontendStack } from '../lib/hotdoc-frontend-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';

// Deploy core infrastructure first
const coreStack = new HotdocCoreStack(app, `HotdocCore-${environment}`, {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2',
  },
  description: `HotDoc Alternative MVP Core Infrastructure - ${environment} environment`,
});

// Deploy API stack with dependencies on core stack
new HotdocApiStack(app, `HotdocApi-${environment}`, {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2',
  },
  description: `HotDoc Alternative MVP API Layer - ${environment} environment`,
  adminUserPoolId: coreStack.adminUserPool.userPoolId,
  practicesTableName: coreStack.practicesTable.tableName,
  providersTableName: coreStack.providersTable.tableName,
});

// Deploy frontend stack
new HotdocFrontendStack(app, `HotdocFrontend-${environment}`, {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2',
  },
  description: `HotDoc Alternative MVP Frontend Layer - ${environment} environment`,
});