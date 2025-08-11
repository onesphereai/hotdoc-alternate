# Deployment Guide

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **SAM CLI** installed
4. **Node.js 20+** and **pnpm 8+**

## Step 1: Build the Application

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Step 2: Deploy Infrastructure

```bash
cd infra

# Build SAM application
sam build

# Deploy with guided setup (first time)
sam deploy --guided

# Or deploy to specific environment
sam deploy --config-env dev
```

### SAM Deploy Parameters

When running `sam deploy --guided`, provide these values:

- **Stack Name**: `hotdoc-alt-dev` (or `hotdoc-alt-prod`)
- **AWS Region**: `ap-southeast-2`
- **Environment**: `dev` (or `staging`, `prod`)
- **Confirm changes**: Y
- **Allow SAM CLI to create IAM roles**: Y
- **Save parameters to config**: Y

## Step 3: Configure Environment Variables

After deployment, update the frontend environment variables:

### Get Outputs
```bash
# Get API URL and Cognito details
sam list stack-outputs --stack-name hotdoc-alt-dev
```

### Admin App Environment
Create `web/admin/.env`:
```bash
VITE_API_URL=https://your-api-gateway-id.execute-api.ap-southeast-2.amazonaws.com
VITE_USER_POOL_ID=ap-southeast-2_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=your-admin-client-id
VITE_AWS_REGION=ap-southeast-2
```

### Public App Environment  
Create `web/public/.env`:
```bash
VITE_API_URL=https://your-api-gateway-id.execute-api.ap-southeast-2.amazonaws.com
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
VITE_AWS_REGION=ap-southeast-2
```

## Step 4: Seed Test Data

```bash
# Build and run the seed script (requires AWS credentials)
cd services/core-api
node -r ts-node/register src/scripts/seed.ts
```

## Step 5: Deploy Frontend Applications

### Option A: Static Hosting (S3 + CloudFront)

```bash
# Build production versions
pnpm --filter @hotdoc-alt/admin build
pnpm --filter @hotdoc-alt/public build

# Upload to S3 (replace with your bucket names)
aws s3 sync web/admin/dist s3://hotdoc-alt-admin-bucket --delete
aws s3 sync web/public/dist s3://hotdoc-alt-public-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Option B: Development Mode

```bash
# Run locally for testing
pnpm --filter @hotdoc-alt/admin dev  # Port 5173
pnpm --filter @hotdoc-alt/public dev # Port 5174
```

## Step 6: Create First Admin User

1. Go to AWS Cognito console
2. Find the admin user pool: `hotdoc-alt-admins-{env}`
3. Create a new user with:
   - Username: your email
   - Temporary password
   - Custom attributes:
     - `custom:tenantId`: `demo-tenant-1`
     - `custom:role`: `admin`

## Step 7: Test the Application

1. Open admin dashboard at your deployment URL
2. Login with the created admin user
3. Complete the practice onboarding wizard
4. Add healthcare providers
5. Test the public booking flow

## Environment-Specific Configurations

### Development
- Single region deployment
- Lower-cost DynamoDB (On-Demand)
- CloudWatch logs retention: 7 days
- No custom domain

### Production  
- Multi-AZ deployment
- DynamoDB with backup enabled
- CloudWatch logs retention: 30 days
- Custom domain with SSL certificate
- Enhanced monitoring and alerting

## Monitoring & Troubleshooting

### CloudWatch Dashboards
- API Gateway metrics
- Lambda function metrics  
- DynamoDB performance
- Cognito authentication metrics

### Common Issues

1. **CORS Errors**: Check API Gateway CORS configuration
2. **Auth Issues**: Verify Cognito User Pool and Client IDs
3. **Database Errors**: Check DynamoDB table names and permissions
4. **Build Failures**: Ensure all shared packages are built first

### Logs

```bash
# View Lambda logs
sam logs -n GetPracticesFunction --stack-name hotdoc-alt-dev --tail

# View API Gateway logs
aws logs describe-log-groups --log-group-name-prefix "/aws/apigateway"
```

## Rollback Procedure

```bash
# Rollback infrastructure
sam deploy --config-env dev --parameter-overrides Environment=dev --no-confirm-changeset --force-rollback

# Or delete the stack entirely
sam delete --stack-name hotdoc-alt-dev
```

## Security Checklist

- [ ] All secrets stored in AWS SSM Parameter Store
- [ ] IAM roles follow least privilege principle
- [ ] DynamoDB tables encrypted at rest
- [ ] API Gateway uses TLS 1.2+
- [ ] Cognito MFA enabled for admin users
- [ ] CloudTrail enabled for audit logging
- [ ] VPC endpoints configured (if using private subnets)

## Cost Optimization

- Use DynamoDB On-Demand for variable workloads
- Set Lambda memory sizes appropriately (512MB default)
- Configure CloudWatch log retention policies
- Use S3 lifecycle policies for log archival
- Monitor costs with AWS Cost Explorer