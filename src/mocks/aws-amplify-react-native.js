// Mock for @aws-amplify/react-native — replaces the native module so aws-amplify
// works in Expo Go without requiring pod install / development build.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { Buffer } from 'buffer';
import { encode, decode } from 'base-64';

// Cognito SRP 2048-bit prime N
const INIT_N =
  'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' +
  '29024E088A67CC74020BBEA63B139B22514A08798E3404DD' +
  'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245' +
  'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' +
  'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D' +
  'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F' +
  '83655D23DCA3AD961C62F356208552BB9ED529077096966D' +
  '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B' +
  'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9' +
  'DE2BCBF6955817183995497CEA956AE515D2261898FA0510' +
  '15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64' +
  'ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7' +
  'ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B' +
  'F12FFA06D98A0864D87602733EC86A64521F2B18177B200C' +
  'BBE117577A615D6C770988C0BAD946E208E24FA074E5AB31' +
  '43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF';

function bigModPow(base, exponent, modulus) {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = ((base % modulus) + modulus) % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) result = result * base % modulus;
    exponent >>= 1n;
    base = base * base % modulus;
  }
  return result;
}

export function computeModPow({ base, exponent, divisor }) {
  const b = BigInt('0x' + base);
  const e = BigInt('0x' + exponent);
  const m = BigInt('0x' + divisor);
  return Promise.resolve(bigModPow(b, e, m).toString(16));
}

export function computeS({ a, g, k, x, b, u }) {
  const N = BigInt('0x' + INIT_N);
  const aBig = BigInt('0x' + a);
  const gBig = BigInt('0x' + g);
  const kBig = BigInt('0x' + k);
  const xBig = BigInt('0x' + x);
  const BBig = BigInt('0x' + b);
  const uBig = BigInt('0x' + u);

  // S = (B - k*g^x)^(a + u*x) mod N
  const gx = bigModPow(gBig, xBig, N);
  const kgx = kBig * gx % N;
  const base = ((BBig - kgx) % N + N) % N;
  const exp = aBig + uBig * xBig;
  const S = bigModPow(base, exp, N);
  return Promise.resolve(S.toString(16));
}

export function loadGetRandomValues() {}
export function loadBase64() { return { encode, decode }; }
export function loadBuffer() { return Buffer; }
export function loadUrlPolyfill() {}
export function loadNetInfo() {}
export function loadAsyncStorage() { return AsyncStorage; }
export function loadAppState() { return AppState; }
export function loadAmplifyWebBrowser() {}
export function loadAmplifyPushNotification() {}
export function loadAmplifyRtnPasskeys() {}

export function getOperatingSystem() { return null; }
export function getDeviceName() { return null; }
export function getIsNativeError() { return false; }

export class KeyValueStorage {
  async setItem(key, value) { return AsyncStorage.setItem(key, value); }
  async getItem(key) { return AsyncStorage.getItem(key); }
  async removeItem(key) { return AsyncStorage.removeItem(key); }
  async clear() { return AsyncStorage.clear(); }
}
