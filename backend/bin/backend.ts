#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AuthStack } from '../lib/stacks/AuthStack';
import { DatabaseStack } from '../lib/stacks/DatabaseStack';
import { ApiStack } from '../lib/stacks/ApiStack';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const authStack = new AuthStack(app, 'RoamlyAuthStack', { env });
const dbStack   = new DatabaseStack(app, 'RoamlyDbStack',   { env });
new ApiStack(app, 'RoamlyApiStack', {
  env,
  userPool:            authStack.userPool,
  userPoolClientId:    authStack.userPoolClient.userPoolClientId,
  dbEndpoint:          dbStack.dbInstance.instanceEndpoint.hostname,
  dbSecret:            dbStack.dbSecret,
  vpc:                 dbStack.vpc,
  lambdaSecurityGroup: dbStack.lambdaSecurityGroup,
});
