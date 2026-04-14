import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { queryOne } from './db';

export interface RequestUser {
  id: string;
  cognito_sub: string;
  username: string;
  email: string;
}

export function getCognitoSub(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
  return event.requestContext.authorizer.jwt.claims['sub'] as string;
}

export async function getRequestUser(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<RequestUser> {
  const sub = getCognitoSub(event);
  const user = await queryOne<RequestUser>(
    'SELECT id, cognito_sub, username, email FROM users WHERE cognito_sub = $1',
    [sub]
  );
  if (!user) throw Object.assign(new Error('User profile not found'), { statusCode: 404 });
  return user;
}
