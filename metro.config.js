const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const mockPath = path.resolve(__dirname, 'src/mocks/aws-amplify-react-native.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@aws-amplify/react-native') {
    return { filePath: mockPath, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
