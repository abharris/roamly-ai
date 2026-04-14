import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  userPoolClientId: string;
  dbEndpoint: string;
  dbSecret: secretsmanager.Secret;
  vpc: ec2.Vpc;
  lambdaSecurityGroup: ec2.SecurityGroup;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userPool, userPoolClientId, dbEndpoint, dbSecret, vpc, lambdaSecurityGroup } = props;

    // Shared Lambda environment
    const lambdaEnv: Record<string, string> = {
      DB_HOST: dbEndpoint,
      DB_NAME: 'roamly',
      DB_USER: 'roamly_admin',
      DB_SECRET_ARN: dbSecret.secretArn,
      AWS_REGION_NAME: this.region,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? '',
    };

    const lambdaDefaults: Partial<lambdaNode.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnv,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
      bundling: { minify: true, sourceMap: false, externalModules: ['pg-native'] },
      timeout: cdk.Duration.seconds(15),
    };

    const makeFn = (name: string, entry: string) =>
      new lambdaNode.NodejsFunction(this, name, {
        ...lambdaDefaults,
        entry: path.join(__dirname, '..', 'lambdas', entry),
        functionName: `roamly-${name.toLowerCase()}`,
      });

    const tripsFn         = makeFn('Trips',           'trips/handler.ts');
    const placesFn        = makeFn('Places',          'places/handler.ts');
    const itineraryFn     = makeFn('Itinerary',       'itinerary/handler.ts');
    const friendsFn       = makeFn('Friends',         'friends/handler.ts');
    const usersFn         = makeFn('Users',           'users/handler.ts');
    const aiParseFn       = makeFn('AIParse',         'ai-parse/handler.ts');
    const recommendFn     = makeFn('Recommendations', 'recommendations/handler.ts');
    const migrateFn       = makeFn('Migrate',         'migrate/handler.ts');

    // Grant Lambdas read access to the DB secret
    [tripsFn, placesFn, itineraryFn, friendsFn, usersFn, aiParseFn, recommendFn, migrateFn].forEach((fn) => {
      dbSecret.grantRead(fn);
    });

    // Cognito JWT authorizer
    const authorizer = new authorizers.HttpJwtAuthorizer('CognitoAuth', userPool.userPoolProviderUrl, {
      jwtAudience: [userPoolClientId],
    });

    // HTTP API
    const api = new apigateway.HttpApi(this, 'RoamlyApi', {
      apiName: 'roamly-api',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['Authorization', 'Content-Type'],
      },
    });

    const addRoutes = (
      methods: apigateway.HttpMethod[],
      path: string,
      fn: lambda.Function,
      auth = true
    ) => {
      api.addRoutes({
        path,
        methods,
        integration: new integrations.HttpLambdaIntegration(`Integration-${path.replace(/[^a-zA-Z0-9]/g, '-')}`, fn),
        ...(auth ? { authorizer } : {}),
      });
    };

    // Health check (no auth)
    addRoutes([apigateway.HttpMethod.GET], '/v1/health', usersFn, false);

    // Users
    addRoutes([apigateway.HttpMethod.POST], '/v1/users/profile', usersFn);
    addRoutes([apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT], '/v1/users/me', usersFn);
    addRoutes([apigateway.HttpMethod.GET], '/v1/users/search', usersFn);
    addRoutes([apigateway.HttpMethod.GET], '/v1/users/{userId}', usersFn);

    // Friends
    addRoutes([apigateway.HttpMethod.GET], '/v1/friends', friendsFn);
    addRoutes([apigateway.HttpMethod.GET], '/v1/friends/requests', friendsFn);
    addRoutes([apigateway.HttpMethod.POST], '/v1/friends/requests', friendsFn);
    addRoutes([apigateway.HttpMethod.PUT], '/v1/friends/requests/{requestId}', friendsFn);
    addRoutes([apigateway.HttpMethod.DELETE], '/v1/friends/{friendId}', friendsFn);

    // Trips
    addRoutes([apigateway.HttpMethod.GET, apigateway.HttpMethod.POST], '/v1/trips', tripsFn);
    addRoutes([apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE], '/v1/trips/{tripId}', tripsFn);
    addRoutes([apigateway.HttpMethod.GET, apigateway.HttpMethod.POST], '/v1/trips/{tripId}/members', tripsFn);
    addRoutes([apigateway.HttpMethod.DELETE], '/v1/trips/{tripId}/members/{userId}', tripsFn);

    // Places
    addRoutes([apigateway.HttpMethod.GET], '/v1/places', placesFn);
    addRoutes([apigateway.HttpMethod.GET, apigateway.HttpMethod.POST], '/v1/trips/{tripId}/places', placesFn);
    addRoutes([apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE], '/v1/trips/{tripId}/places/{placeId}', placesFn);
    addRoutes([apigateway.HttpMethod.GET], '/v1/places/autocomplete', placesFn);
    addRoutes([apigateway.HttpMethod.GET], '/v1/places/details/{googlePlaceId}', placesFn);

    // Itinerary
    addRoutes([apigateway.HttpMethod.GET, apigateway.HttpMethod.POST], '/v1/trips/{tripId}/itinerary', itineraryFn);
    addRoutes([apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE], '/v1/trips/{tripId}/itinerary/{itemId}', itineraryFn);
    addRoutes([apigateway.HttpMethod.POST], '/v1/trips/{tripId}/itinerary/reorder', itineraryFn);

    // AI Parse
    addRoutes([apigateway.HttpMethod.POST], '/v1/trips/{tripId}/parse', aiParseFn);
    addRoutes([apigateway.HttpMethod.POST], '/v1/trips/{tripId}/parse/confirm', aiParseFn);

    // Recommendations
    addRoutes([apigateway.HttpMethod.GET, apigateway.HttpMethod.POST], '/v1/recommendations', recommendFn);
    addRoutes([apigateway.HttpMethod.DELETE], '/v1/recommendations/{recId}', recommendFn);

    // Rate limiting via API Gateway stage throttling.
    // defaultRouteSettings applies a global safety-net limit across all routes.
    // routeSettings overrides apply tighter per-route limits for expensive endpoints.
    const cfnStage = api.defaultStage?.node.defaultChild as apigateway.CfnStage;
    cfnStage.defaultRouteSettings = {
      throttlingRateLimit: 200,
      throttlingBurstLimit: 400,
    };
    // routeSettings is typed as `any` — CDK does not transform these keys,
    // so PascalCase is required to match the CloudFormation API spec.
    cfnStage.routeSettings = {
      'GET /v1/places/autocomplete': {
        ThrottlingRateLimit: 60,
        ThrottlingBurstLimit: 80,
      },
      'POST /v1/trips/{tripId}/parse': {
        ThrottlingRateLimit: 10,
        ThrottlingBurstLimit: 15,
      },
      'POST /v1/trips/{tripId}/parse/confirm': {
        ThrottlingRateLimit: 10,
        ThrottlingBurstLimit: 15,
      },
    };

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
  }
}
