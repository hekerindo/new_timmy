import * as cdk from 'aws-cdk-lib'; 
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

export class NewtimmyxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: '166190020492', 
        region: 'us-east-1', 
      },
    });

    // Mengambil Hosted Zone
   const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: 'serverless.my.id',
    });

    // Mengambil sertifikat SSL dari ARN
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', 'arn:aws:acm:us-east-1:166190020492:certificate/1119d63b-db83-4afb-b726-4a8944f6ec7f');

    // Membuat s3 bucket 
const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: 'newtimmy3-serverless-site',
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
    });
    // Membuat  CloudFront distribution
      const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: { origin: new cloudfrontOrigins.S3Origin(siteBucket) },
      domainNames: ['newtimmy3.serverless.my.id'],
      certificate: certificate,
    });
    // Membuat ARecord di Route 53
    new route53.ARecord(this, 'SiteAliasRecord', {
      zone: zone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      recordName: 'newtimmy3',
});


    // Mendeploy website ke bucket S3
      new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3deploy.Source.asset('./website')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}

