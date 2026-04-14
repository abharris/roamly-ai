import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { signIn, signUp, confirmSignUp, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { router } from 'expo-router';
import { ROUTES } from '../../src/constants/routes';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { usersApi } from '../../src/api/users';
import { Colors, Fonts } from '../../src/theme';

type Mode = 'login' | 'signup' | 'confirm' | 'setup';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // If a valid cached session exists, skip the login screen
  React.useEffect(() => {
    fetchAuthSession()
      .then((session) => {
        if (session.tokens?.idToken) {
          router.replace(ROUTES.trips);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      try {
        await signIn({ username: email, password });
      } catch (e: any) {
        if (e?.name === 'UserAlreadyAuthenticatedException') {
          // Stale session — sign out and re-authenticate to verify password
          await signOut();
          await signIn({ username: email, password });
        } else {
          throw e;
        }
      }
      try {
        await usersApi.getMe();
        router.replace(ROUTES.trips);
      } catch {
        setMode('setup');
      }
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      await usersApi.createProfile({ username: username.trim() });
      router.replace(ROUTES.trips);
    } catch (e: any) {
      Alert.alert('Setup failed', e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await signUp({ username: email, password, options: { userAttributes: { email } } });
      setMode('confirm');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      await signIn({ username: email, password });
      await usersApi.createProfile({ username });
      router.replace(ROUTES.trips);
    } catch (e: any) {
      Alert.alert('Confirmation failed', e.message ?? e.toString() ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Roamly</Text>
          <Text style={styles.sub}>Plan trips with friends</Text>
        </View>

        <View style={styles.card}>
          {mode === 'login' && (
            <>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Input label="Email" value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Input label="Password" value={password} onChangeText={setPassword}
                secureTextEntry autoComplete="password" />
              <Button label="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />
              <Button label="Create an account" onPress={() => setMode('signup')}
                variant="ghost" style={styles.switchBtn} />
            </>
          )}

          {mode === 'signup' && (
            <>
              <Text style={styles.cardTitle}>Create account</Text>
              <Input label="Username" value={username} onChangeText={setUsername}
                autoCapitalize="none" autoComplete="username" />
              <Input label="Email" value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Input label="Password" value={password} onChangeText={setPassword}
                secureTextEntry autoComplete="new-password" />
              <Button label="Create Account" onPress={handleSignUp} loading={loading} style={styles.btn} />
              <Button label="Already have an account? Sign in" onPress={() => setMode('login')}
                variant="ghost" style={styles.switchBtn} />
            </>
          )}

          {mode === 'setup' && (
            <>
              <Text style={styles.cardTitle}>Choose a username</Text>
              <Text style={styles.confirmText}>Pick a username to finish setting up your account.</Text>
              <Input label="Username" value={username} onChangeText={setUsername}
                autoCapitalize="none" autoComplete="username" />
              <Button label="Continue" onPress={handleSetup} loading={loading} style={styles.btn} />
            </>
          )}

          {mode === 'confirm' && (
            <>
              <Text style={styles.cardTitle}>Check your email</Text>
              <Text style={styles.confirmText}>
                We sent a 6-digit code to {email}
              </Text>
              <Input label="Confirmation Code" value={code} onChangeText={setCode}
                keyboardType="number-pad" />
              <Button label="Confirm" onPress={handleConfirm} loading={loading} style={styles.btn} />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.mint },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontFamily: Fonts.displayBold, color: Colors.primary },
  sub: { fontSize: 16, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.textPrimary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  cardTitle: { fontSize: 20, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary, marginBottom: 20 },
  btn: { marginTop: 8 },
  switchBtn: { marginTop: 8 },
  confirmText: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textMuted, marginBottom: 16, lineHeight: 20 },
});
