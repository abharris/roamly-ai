import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'RoamlyVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { cidrMask: 24, name: 'public', subnetType: ec2.SubnetType.PUBLIC },
        { cidrMask: 24, name: 'private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        { cidrMask: 28, name: 'isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    this.dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: 'roamly/db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'roamly_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSG', {
      vpc: this.vpc,
      description: 'Aurora PostgreSQL security group',
    });

    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSG', {
      vpc: this.vpc,
      description: 'Lambda security group',
    });

    dbSecurityGroup.addIngressRule(this.lambdaSecurityGroup, ec2.Port.tcp(5432));

    this.dbInstance = new rds.DatabaseInstance(this, 'RoamlyDb', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      databaseName: 'roamly',
      multiAz: false,
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    new cdk.CfnOutput(this, 'DbEndpoint', { value: this.dbInstance.instanceEndpoint.hostname });
    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
  }
}
