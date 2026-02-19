// client/screens/AllFriends.js
import { useContext, useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlobalStyles } from '../constants/styles';
import { AuthContext } from '../store/auth-context';
import { getAllFriends, inviteContactToJoin, deleteContact, removeFriend } from '../util/friend';

function FriendCard({ item, onInvite, onRemove }) {
  const isContact = item.type === 'contact';
  const initials  = (item.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={s.card}>
      <View style={[s.avatar, isContact && s.avatarContact]}>
        {item.profileImage
          ? <Image source={{ uri: item.profileImage }} style={s.avatarImg} />
          : <Text style={s.avatarInitials}>{initials}</Text>}
        <View style={[s.typeDot, isContact ? s.typeDotContact : s.typeDotUser]}>
          <Ionicons name={isContact ? 'mail' : 'person'} size={8} color="#fff" />
        </View>
      </View>

      <View style={s.cardInfo}>
        <Text style={s.cardName} numberOfLines={1}>{item.name || 'Unknown'}</Text>
        <Text style={s.cardEmail} numberOfLines={1}>{item.email}</Text>
        {isContact && (
          <View style={s.statusPill}>
            <Text style={s.statusPillText}>
              {item.invitedToJoin ? '📨 Invited' : '📧 No account yet'}
            </Text>
          </View>
        )}
      </View>

      <View style={s.cardActions}>
        {isContact && !item.invitedToJoin && (
          <TouchableOpacity style={s.actionBtn} onPress={() => onInvite(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="send-outline" size={18} color={GlobalStyles.colors.primary500} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.actionBtn} onPress={() => onRemove(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close-circle-outline" size={18} color={GlobalStyles.colors.error500} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AllFriends() {
  const navigation = useNavigation();
  const [friends,     setFriends]     = useState([]);
  const [isFetching,  setIsFetching]  = useState(true);
  const [error,       setError]       = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter,      setFilter]      = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setIsFetching(true);
    setError(null);
    try {
      const list = await getAllFriends();
      setFriends(list);
    } catch (e) {
      setError('Could not fetch friends!');
    }
    setIsFetching(false);
  }

  const displayed = useMemo(() => {
    let list = filter === 'all' ? friends : friends.filter(f => f.type === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f =>
        f.name?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q));
    }
    return list;
  }, [friends, filter, searchQuery]);

  const userCount    = friends.filter(f => f.type === 'user').length;
  const contactCount = friends.filter(f => f.type === 'contact').length;

  async function handleInvite(item) {
    try {
      await inviteContactToJoin(item.id);
      Alert.alert('Invitation Sent!', `An invite was sent to ${item.email}.`);
      setFriends(prev => prev.map(f => f.id === item.id ? { ...f, invitedToJoin: true } : f));
    } catch {
      Alert.alert('Error', 'Could not send invitation. Please try again.');
    }
  }

  async function handleRemove(item) {
    console.log("🔴 handleRemove called with:", item);
    console.log("Item type:", item.type);
    console.log("Item ID:", item.id);
    
    // For web compatibility, use window.confirm if Alert isn't available
    const confirmRemove = () => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
          const confirmed = window.confirm(`Remove ${item.name}?`);
          resolve(confirmed);
        } else {
          Alert.alert(
            `Remove ${item.type === 'contact' ? 'Contact' : 'Friend'}`,
            `Remove ${item.name}?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Remove', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        }
      });
    };

    const confirmed = await confirmRemove();
    console.log("User confirmed:", confirmed);
    
    if (!confirmed) {
      console.log("User cancelled removal");
      return;
    }

    try {
      console.log(`🟡 Attempting to remove ${item.type}:`, item.id);
      
      if (item.type === 'contact') {
        console.log("Calling deleteContact...");
        await deleteContact(item.id);
        console.log("✅ deleteContact succeeded");
      } else {
        console.log("Calling removeFriend...");
        await removeFriend(item.id);
        console.log("✅ removeFriend succeeded");
      }
      
      console.log("Updating local state...");
      setFriends(prev => prev.filter(f => f.id !== item.id));
      console.log("✅ Local state updated");
      
      Alert.alert('Success', `${item.name} has been removed.`);
    } catch (error) {
      console.error('❌ Remove failed:', error);
      console.error('Error details:', error.message);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', `Could not remove ${item.name}. ${error.message || 'Please try again.'}`);
    }
  }

  if (isFetching) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
        <Text style={s.stateText}>Loading your network…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.centered}>
        <Ionicons name="alert-circle-outline" size={52} color={GlobalStyles.colors.error500} />
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={load}>
          <Text style={s.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>My Network</Text>
          <Text style={s.headerSub}>
            {friends.length} connection{friends.length !== 1 ? 's' : ''} · {userCount} on app · {contactCount} contact{contactCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddFriend')}>
          <Ionicons name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search" size={17} color={GlobalStyles.colors.gray400} />
        <TextInput style={s.searchInput} placeholder="Search name or email…"
          value={searchQuery} onChangeText={setSearchQuery}
          autoCorrect={false} autoCapitalize="none" />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={17} color={GlobalStyles.colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.filterRow}>
        {[
          { key: 'all',     label: `All (${friends.length})` },
          { key: 'user',    label: `Friends (${userCount})` },
          { key: 'contact', label: `Contacts (${contactCount})` },
        ].map(f => (
          <TouchableOpacity key={f.key}
            style={[s.pill, filter === f.key && s.pillActive]}
            onPress={() => setFilter(f.key)}>
            <Text style={[s.pillText, filter === f.key && s.pillTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {displayed.length === 0 ? (
        <View style={s.centered}>
          <Ionicons name="people-outline" size={64} color={GlobalStyles.colors.gray300} />
          <Text style={s.emptyTitle}>
            {searchQuery ? 'No results found' : filter !== 'all' ? `No ${filter}s yet` : 'No connections yet'}
          </Text>
          {!searchQuery && (
            <>
              <Text style={s.emptySubtitle}>Add friends or contacts to grow your network</Text>
              <TouchableOpacity style={s.addFirstBtn} onPress={() => navigation.navigate('AddFriend')}>
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={s.addFirstBtnText}>Add Someone</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.id?.toString()}
          renderItem={({ item }) => (
            <FriendCard item={item} onInvite={handleInvite} onRemove={handleRemove} />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

export default AllFriends;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GlobalStyles.colors.gray50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: GlobalStyles.colors.primary700, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, color: '#333', outlineStyle: 'none' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  pill:           { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff', borderWidth: 1, borderColor: GlobalStyles.colors.gray200 },
  pillActive:     { backgroundColor: GlobalStyles.colors.primary500, borderColor: GlobalStyles.colors.primary500 },
  pillText:       { fontSize: 13, fontWeight: '600', color: GlobalStyles.colors.primary500 },
  pillTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: GlobalStyles.colors.primary200, justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  avatarContact: { backgroundColor: GlobalStyles.colors.warning500 },
  avatarImg:     { width: 50, height: 50, borderRadius: 25 },
  avatarInitials:{ fontSize: 18, fontWeight: '700', color: GlobalStyles.colors.primary700 },
  typeDot: { position: 'absolute', bottom: -1, right: -1, width: 17, height: 17, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  typeDotUser:    { backgroundColor: GlobalStyles.colors.primary500 },
  typeDotContact: { backgroundColor: GlobalStyles.colors.warning500 },
  cardInfo:  { flex: 1 },
  cardName:  { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  cardEmail: { fontSize: 13, color: GlobalStyles.colors.gray500, marginBottom: 4 },
  statusPill: { alignSelf: 'flex-start', backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontSize: 11, color: '#92400e', fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 4 },
  actionBtn:   { padding: 6 },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  stateText:    { marginTop: 12, color: GlobalStyles.colors.gray500, fontSize: 14 },
  errorText:    { color: GlobalStyles.colors.error500, fontSize: 15, textAlign: 'center', marginVertical: 10 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: GlobalStyles.colors.gray400, marginTop: 16, textAlign: 'center' },
  emptySubtitle:{ fontSize: 14, color: GlobalStyles.colors.gray400, marginTop: 6, textAlign: 'center' },
  retryBtn:     { backgroundColor: GlobalStyles.colors.primary500, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
  retryBtnText: { color: '#fff', fontWeight: '700' },
  addFirstBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GlobalStyles.colors.primary500, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 20 },
  addFirstBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});