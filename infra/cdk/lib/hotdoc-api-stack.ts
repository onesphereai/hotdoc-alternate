import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface HotdocApiStackProps extends cdk.StackProps {
  environment: string;
  adminUserPoolId: string;
  practicesTableName: string;
  providersTableName: string;
}

export class HotdocApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: HotdocApiStackProps) {
    super(scope, id, props);

    const { environment, practicesTableName, providersTableName } = props;
    // adminUserPoolId temporarily unused for development/testing

    // Import existing Cognito User Pool (commented out for development/testing)
    // const adminUserPool = cognito.UserPool.fromUserPoolId(
    //   this,
    //   'AdminUserPool',
    //   adminUserPoolId
    // );

    // Common Lambda environment variables
    const commonEnv = {
      ENVIRONMENT: environment,
      PRACTICES_TABLE: practicesTableName,
      PROVIDERS_TABLE: providersTableName,
    };

    // Common Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                `arn:aws:dynamodb:${this.region}:${this.account}:table/${practicesTableName}*`,
                `arn:aws:dynamodb:${this.region}:${this.account}:table/${providersTableName}*`,
              ],
            }),
          ],
        }),
      },
    });

    // Lambda Functions
    const createPracticeFunction = new lambda.Function(this, 'CreatePracticeFunction', {
      functionName: `hotdoc-alt-create-practice-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/practices/create.handler',
      code: lambda.Code.fromAsset('../../services/core-api'),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 512,
    });

    const getPracticesFunction = new lambda.Function(this, 'GetPracticesFunction', {
      functionName: `hotdoc-alt-get-practices-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/practices/list.handler',
      code: lambda.Code.fromAsset('../../services/core-api'),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 512,
    });

    const createProviderFunction = new lambda.Function(this, 'CreateProviderFunction', {
      functionName: `hotdoc-alt-create-provider-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/providers/create.handler',
      code: lambda.Code.fromAsset('../../services/core-api'),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 512,
    });

    const getProvidersFunction = new lambda.Function(this, 'GetProvidersFunction', {
      functionName: `hotdoc-alt-get-providers-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/providers/list.handler',
      code: lambda.Code.fromAsset('../../services/core-api'),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 512,
    });

    // API Gateway
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `hotdoc-alt-api-${environment}`,
      description: 'HotDoc Alternative API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Tenant-Id',
        ],
        maxAge: cdk.Duration.hours(24),
      },
    });

    // Cognito Authorizer (commented out for development/testing)
    // const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
    //   this,
    //   'CognitoAuthorizer',
    //   {
    //     cognitoUserPools: [adminUserPool],
    //     identitySource: 'method.request.header.Authorization',
    //   }
    // );

    // API Resources and Methods
    const v1 = this.api.root.addResource('v1');
    
    // Practices endpoints
    const practices = v1.addResource('practices');
    
    // Temporarily remove authorization for development/testing
    practices.addMethod('POST', new apigateway.LambdaIntegration(createPracticeFunction));

    practices.addMethod('GET', new apigateway.LambdaIntegration(getPracticesFunction));

    // Providers endpoints
    const providers = v1.addResource('providers');
    
    // Temporarily remove authorization for development/testing
    providers.addMethod('POST', new apigateway.LambdaIntegration(createProviderFunction));
    providers.addMethod('GET', new apigateway.LambdaIntegration(getProvidersFunction));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: `HotdocAlt-${environment}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'CreatePracticeFunctionName', {
      value: createPracticeFunction.functionName,
      description: 'Create Practice Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'GetPracticesFunctionName', {
      value: getPracticesFunction.functionName,
      description: 'Get Practices Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'CreateProviderFunctionName', {
      value: createProviderFunction.functionName,
      description: 'Create Provider Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'GetProvidersFunctionName', {
      value: getProvidersFunction.functionName,
      description: 'Get Providers Lambda Function Name',
    });
  }
}