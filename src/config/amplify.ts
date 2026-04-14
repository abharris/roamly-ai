import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { KeyValueStorage } from '../mocks/aws-amplify-react-native';

export function configureAmplify() {
  cognitoUserPoolsTokenProvider.setKeyValueStorage(new KeyValueStorage());
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID!,
      },
    },
  });
}
