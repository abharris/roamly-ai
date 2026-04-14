import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { signOut } from 'aws-amplify/auth';
import { router } from 'expo-router';
import { ROUTES } from '../../../src/constants/routes';
import { queryClient } from '../../../src/config/queryClient';
import { useCurrentUser, useUpdateProfile } from '../../../src/hooks/useCurrentUser';
import { useTrips } from '../../../src/hooks/useTrips';
import { useFriends, useFriendRequests, useRespondToFriendRequest, useUnfriend } from '../../../src/hooks/useFriends';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Friendship } from '../../../src/types/models';
import { Colors, Fonts, FontSizes, Radius, Spacing } from '../../../src/theme';

function FriendRow({ friendship, onRemove, currentUserId }: { friendship: Friendship; onRemove: () => void; currentUserId?: string }) {
  // Backend returns flat fields; pick the other person's name
  const name = friendship.requester_id === currentUserId
    ? (friendship.addressee_username ?? friendship.addressee?.username)
    : (friendship.requester_username ?? friendship.requester?.username);
  return (
    <View style={styles.friendRow}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendInitial}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <Text style={styles.friendName}>{name ?? '—'}</Text>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn} accessibilityLabel={`Remove ${name ?? 'friend'}`} accessibilityRole="button">
        <Text style={styles.removeBtnText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
}

function RequestRow({
  request,
  onAccept,
  onDecline,
}: {
  request: Friendship;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const name = request.requester_username ?? request.requester?.username ?? '?';
  return (
    <View style={styles.friendRow}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendInitial}>{name[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <Text style={[styles.friendName, { flex: 1 }]}>{name}</Text>
      <TouchableOpacity onPress={onAccept} style={[styles.reqBtn, styles.acceptBtn]} accessibilityLabel={`Accept friend request from ${name}`} accessibilityRole="button">
        <Text style={styles.acceptBtnText}>✓</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDecline} style={[styles.reqBtn, styles.declineBtn]} accessibilityLabel={`Decline friend request from ${name}`} accessibilityRole="button">
        <Text style={styles.declineBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: trips = [] } = useTrips();
  const tripCount = trips.length;
  const placesCount = trips.reduce((sum, t) => sum + (Number(t.places_count) || 0), 0);
  const countriesCount = new Set(
    trips.map((t) => t.location?.split(',').pop()?.trim()).filter(Boolean)
  ).size;

  const { data: friends = [] } = useFriends();
  const { data: requests = [] } = useFriendRequests();
  const updateProfile = useUpdateProfile();
  const respondToRequest = useRespondToFriendRequest();
  const unfriend = useUnfriend();

  const [editUsername, setEditUsername] = useState('');
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    if (!editUsername.trim()) return;
    updateProfile.mutate({ username: editUsername.trim() }, { onSuccess: () => setEditing(false) });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      queryClient.clear();
      router.replace(ROUTES.auth);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (userLoading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        {editing ? (
          <View style={styles.editRow}>
            <Input value={editUsername} onChangeText={setEditUsername}
              placeholder={user?.username} style={{ flex: 1, marginBottom: 0 }} />
            <Button label="Save" onPress={handleSave} loading={updateProfile.isPending} style={styles.saveBtn} />
          </View>
        ) : (
          <View style={styles.nameRow}>
            <Text style={styles.username}>{user?.username}</Text>
            <TouchableOpacity onPress={() => { setEditUsername(user?.username ?? ''); setEditing(true); }} accessibilityLabel="Edit username" accessibilityRole="button">
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.primary }]}>{tripCount}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.amber }]}>{placesCount}</Text>
            <Text style={styles.statLabel}>Places</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.sky }]}>{countriesCount}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
        </View>

        {requests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Friend Requests ({requests.length})</Text>
            <Card>
              {requests.map((req) => (
                <RequestRow
                  key={req.id}
                  request={req}
                  onAccept={() => respondToRequest.mutate({ requestId: req.id, action: 'accept' })}
                  onDecline={() => respondToRequest.mutate({ requestId: req.id, action: 'decline' })}
                />
              ))}
            </Card>
          </>
        )}

        <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>
        <Card>
          {friends.length === 0 ? (
            <Text style={styles.emptyFriends}>No friends yet. Search in the Friends tab.</Text>
          ) : (
            friends.map((f) => (
              <FriendRow
                key={f.id}
                friendship={f}
                currentUserId={user?.id}
                onRemove={() => unfriend.mutate(f.id)}
              />
            ))
          )}
        </Card>

        <Button label="Sign Out" onPress={handleSignOut} variant="danger" style={styles.signOutBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 20,
    paddingBottom: 28,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: Radius.avatar,
    backgroundColor: Colors.primaryDark,
    borderWidth: 3, borderColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: FontSizes.hero, fontFamily: Fonts.displayBold, color: Colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  username: { fontSize: FontSizes.heading, fontFamily: Fonts.displaySemiBold, color: Colors.white },
  editLink: { fontSize: FontSizes.small, fontFamily: Fonts.mono, color: Colors.primaryBorder },
  editRow: { flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  email: { fontSize: FontSizes.small, fontFamily: Fonts.body, color: Colors.primaryBorder, marginTop: 4 },
  container: { padding: Spacing.screenH, paddingBottom: 60 },
  sectionTitle: { fontSize: FontSizes.small, fontFamily: Fonts.mono, color: Colors.textSecondary, marginBottom: 10, marginTop: 8, letterSpacing: 0.5 },
  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight },
  friendAvatar: { width: 40, height: 40, borderRadius: Radius.avatar, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  friendInitial: { fontSize: FontSizes.subhead, fontFamily: Fonts.displaySemiBold, color: Colors.primary },
  friendName: { fontSize: FontSizes.body, fontFamily: Fonts.bodyMedium, color: Colors.textPrimary },
  removeBtn: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.errorLight, borderRadius: Radius.chip },
  removeBtnText: { fontSize: FontSizes.small, fontFamily: Fonts.mono, color: Colors.errorDark },
  reqBtn: { width: 32, height: 32, borderRadius: Radius.icon, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  acceptBtn: { backgroundColor: Colors.tealLight },
  declineBtn: { backgroundColor: Colors.errorLight },
  acceptBtnText: { color: Colors.primaryDark, fontFamily: Fonts.displaySemiBold },
  declineBtnText: { color: Colors.errorDark, fontFamily: Fonts.displaySemiBold },
  emptyFriends: { fontSize: FontSizes.small, fontFamily: Fonts.body, color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },
  signOutBtn: { marginTop: 32 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.card, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: Colors.cardBorder,
  },
  statNumber: { fontSize: FontSizes.hero, fontFamily: Fonts.displayBold },
  statLabel: { fontSize: FontSizes.label, fontFamily: Fonts.mono, color: Colors.textMuted, marginTop: 2 },
  // unused but kept to avoid removing heading ref
  heading: { fontSize: FontSizes.title, fontFamily: Fonts.displayBold, color: Colors.white },
  profileCard: { alignItems: 'center', marginBottom: 0 },
});
