import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface HotdocFrontendStackProps extends cdk.StackProps {
  environment: string;
}

export class HotdocFrontendStack extends cdk.Stack {
  public readonly adminDistribution: cloudfront.Distribution;
  public readonly publicDistribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: HotdocFrontendStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // S3 Buckets for hosting
    const adminBucket = new s3.Bucket(this, 'AdminBucket', {
      bucketName: `hotdoc-alt-admin-${environment}-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // For SPA routing
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const publicBucket = new s3.Bucket(this, 'PublicBucket', {
      bucketName: `hotdoc-alt-public-${environment}-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // For SPA routing
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Origin Access Control for secure access
    const adminOAC = new cloudfront.S3OriginAccessControl(this, 'AdminOAC', {
      originAccessControlName: `hotdoc-alt-admin-oac-${environment}`,
      description: 'OAC for Admin App',
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    const publicOAC = new cloudfront.S3OriginAccessControl(this, 'PublicOAC', {
      originAccessControlName: `hotdoc-alt-public-oac-${environment}`,
      description: 'OAC for Public App', 
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    // CloudFront Distributions
    this.adminDistribution = new cloudfront.Distribution(this, 'AdminDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(adminBucket, {
          originAccessControl: adminOAC,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        },
      ],
      comment: `HotDoc Alt Admin App - ${environment}`,
    });

    this.publicDistribution = new cloudfront.Distribution(this, 'PublicDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(publicBucket, {
          originAccessControl: publicOAC,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        },
      ],
      comment: `HotDoc Alt Public App - ${environment}`,
    });

    // Deploy built React apps
    new s3deploy.BucketDeployment(this, 'AdminDeployment', {
      sources: [s3deploy.Source.asset('../../web/admin/dist')],
      destinationBucket: adminBucket,
      distribution: this.adminDistribution,
      distributionPaths: ['/*'],
    });

    new s3deploy.BucketDeployment(this, 'PublicDeployment', {
      sources: [s3deploy.Source.asset('../../web/public/dist')],
      destinationBucket: publicBucket,
      distribution: this.publicDistribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'AdminAppUrl', {
      value: `https://${this.adminDistribution.distributionDomainName}`,
      description: 'Admin App CloudFront URL',
      exportName: `HotdocAlt-${environment}-AdminAppUrl`,
    });

    new cdk.CfnOutput(this, 'PublicAppUrl', {
      value: `https://${this.publicDistribution.distributionDomainName}`,
      description: 'Public App CloudFront URL',
      exportName: `HotdocAlt-${environment}-PublicAppUrl`,
    });

    new cdk.CfnOutput(this, 'AdminBucketName', {
      value: adminBucket.bucketName,
      description: 'Admin S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'PublicBucketName', {
      value: publicBucket.bucketName,
      description: 'Public S3 Bucket Name',
    });
  }
}