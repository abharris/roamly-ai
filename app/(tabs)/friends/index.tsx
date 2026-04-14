import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSearchUsers, useSendFriendRequest, useFriends } from '../../../src/hooks/useFriends';
import { User } from '../../../src/types/models';
import { Colors, Fonts, FontSizes, Radius, Spacing } from '../../../src/theme';

function UserRow({ user, isFriend, isPending, onAdd }: {
  user: User;
  isFriend: boolean;
  isPending: boolean;
  onAdd: () => void;
}) {
  return (
    <View style={styles.userRow}>
      <View style={styles.avatar}>
        <Text style={styles.initial}>{user.username[0].toUpperCase()}</Text>
      </View>
      <Text style={styles.username}>{user.username}</Text>
      {isFriend ? (
        <View style={styles.badge}><Text style={styles.badgeText}>Friends</Text></View>
      ) : isPending ? (
        <View style={[styles.badge, styles.pendingBadge]}><Text style={[styles.badgeText, styles.pendingText]}>Pending</Text></View>
      ) : (
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} accessibilityLabel={`Add ${user.username} as friend`} accessibilityRole="button">
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function FriendsSearchScreen() {
  const [query, setQuery] = useState('');
  const { data: results = [], isFetching } = useSearchUsers(query);
  const { data: friends = [] } = useFriends();
  const sendRequest = useSendFriendRequest();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const friendIds = new Set(friends.map((f) => f.requester_id === f.addressee_id ? f.requester_id : [f.requester_id, f.addressee_id]).flat());

  const handleAdd = (userId: string) => {
    sendRequest.mutate(userId, {
      onSuccess: () => setPendingIds((prev) => new Set(prev).add(userId)),
    });
  };

  const renderUser = useCallback(({ item }: { item: User }) => (
    <UserRow
      user={item}
      isFriend={friendIds.has(item.id)}
      isPending={pendingIds.has(item.id)}
      onAdd={() => handleAdd(item.id)}
    />
  ), [friendIds, pendingIds]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.heading}>Find Friends</Text>
        <Text style={styles.subheading}>Search by username to connect</Text>
      </View>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isFetching && <ActivityIndicator color={Colors.primary} style={{ marginRight: 8 }} />}
      </View>

      <FlatList
        data={results}
        keyExtractor={(u) => u.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.trim().length >= 2 && !isFetching ? (
            <Text style={styles.noResults}>No users found for "{query}"</Text>
          ) : query.trim().length < 2 ? (
            <Text style={styles.hint}>Type at least 2 characters to search</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.screenH,
    paddingTop: 16,
    paddingBottom: 20,
  },
  heading: { fontSize: FontSizes.title, fontFamily: Fonts.displayBold, color: Colors.white },
  subheading: { fontSize: FontSizes.small, fontFamily: Fonts.body, color: Colors.primaryBorder, marginTop: 3 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    marginHorizontal: Spacing.screenH,
    marginTop: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 18, marginRight: 8, color: Colors.textMuted },
  searchInput: { flex: 1, fontSize: FontSizes.body, fontFamily: Fonts.body, paddingVertical: 12, color: Colors.textPrimary },
  list: { paddingHorizontal: Spacing.screenH },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight },
  avatar: { width: 44, height: 44, borderRadius: Radius.avatar, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  initial: { fontSize: FontSizes.subhead, fontFamily: Fonts.displaySemiBold, color: Colors.primary },
  username: { flex: 1, fontSize: FontSizes.body, fontFamily: Fonts.bodySemiBold, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill },
  addBtnText: { color: Colors.white, fontFamily: Fonts.displayMedium, fontSize: FontSizes.small },
  badge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.chip },
  badgeText: { fontSize: FontSizes.xs, fontFamily: Fonts.mono, color: Colors.primaryDark },
  pendingBadge: { backgroundColor: Colors.accentLight },
  pendingText: { color: Colors.accent },
  noResults: { textAlign: 'center', fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 40, fontSize: FontSizes.body },
  hint: { textAlign: 'center', fontFamily: Fonts.body, color: Colors.textDisabled, marginTop: 60, fontSize: FontSizes.small },
});
