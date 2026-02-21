// client/screens/AllFriends.js - UPDATED WITH NEW THEME
import { useContext, useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../store/auth-context';
import { getAllFriends, inviteContactToJoin, deleteContact, removeFriend } from '../util/friend';

function FriendCard({ item, onInvite, onRemove }) {
  const isContact = item.type === 'contact';
  const initials = (item.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={[styles.avatar, isContact && styles.avatarContact]}>
        {item.profileImage
          ? <Image source={{ uri: item.profileImage }} style={styles.avatarImg} />
          : <Text style={styles.avatarInitials}>{initials}</Text>}
        <View style={[styles.typeDot, isContact ? styles.typeDotContact : styles.typeDotUser]}>
          <Ionicons name={isContact ? 'mail' : 'person'} size={10} color="#fff" />
        </View>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name || 'Unknown'}</Text>
        <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
        {isContact && (
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {item.invitedToJoin ? '📨 Invited' : '📧 No account yet'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        {isContact && !item.invitedToJoin && (
          <TouchableOpacity 
            style={styles.actionBtnInvite} 
            onPress={() => onInvite(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="send" size={16} color="#4ECDC4" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.actionBtnRemove} 
          onPress={() => onRemove(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AllFriends() {
  const navigation = useNavigation();
  const [friends, setFriends] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

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

  const userCount = friends.filter(f => f.type === 'user').length;
  const contactCount = friends.filter(f => f.type === 'contact').length;

  async function handleInvite(item) {
    try {
      await inviteContactToJoin(item.id);
      Alert.alert('Invitation Sent! 🎉', `An invite was sent to ${item.email}.`);
      setFriends(prev => prev.map(f => f.id === item.id ? { ...f, invitedToJoin: true } : f));
    } catch {
      Alert.alert('Error', 'Could not send invitation. Please try again.');
    }
  }

  async function handleRemove(item) {
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
    if (!confirmed) return;

    try {
      if (item.type === 'contact') {
        await deleteContact(item.id);
      } else {
        await removeFriend(item.id);
      }
      
      setFriends(prev => prev.filter(f => f.id !== item.id));
      Alert.alert('Success', `${item.name} has been removed.`);
    } catch (error) {
      console.error('Remove failed:', error);
      Alert.alert('Error', `Could not remove ${item.name}. ${error.message || 'Please try again.'}`);
    }
  }

  if (isFetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading your network…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEmoji}>👥</Text>
            <View>
              <Text style={styles.headerTitle}>My Network</Text>
              <Text style={styles.headerSub}>
                {friends.length} connection{friends.length !== 1 ? 's' : ''} · {userCount} on app · {contactCount} contact{contactCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddFriend')}>
            <Ionicons name="person-add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search name or email…"
            placeholderTextColor="#999"
            value={searchQuery} 
            onChangeText={setSearchQuery}
            autoCorrect={false} 
            autoCapitalize="none" 
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: `All (${friends.length})`, emoji: '👥' },
          { key: 'user', label: `Friends (${userCount})`, emoji: '🤝' },
          { key: 'contact', label: `Contacts (${contactCount})`, emoji: '📇' },
        ].map(f => (
          <TouchableOpacity 
            key={f.key}
            style={[styles.pill, filter === f.key && styles.pillActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={styles.pillEmoji}>{f.emoji}</Text>
            <Text style={[styles.pillText, filter === f.key && styles.pillTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Friends List */}
      {displayed.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>
            {searchQuery ? '🔍' : filter !== 'all' ? '📭' : '👋'}
          </Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No results found' : filter !== 'all' ? `No ${filter}s yet` : 'No connections yet'}
          </Text>
          {!searchQuery && (
            <>
              <Text style={styles.emptySubtitle}>Add friends or contacts to grow your network</Text>
              <TouchableOpacity 
                style={styles.addFirstBtn} 
                onPress={() => navigation.navigate('AddFriend')}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addFirstBtnGradient}
                >
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.addFirstBtnText}>Add Someone</Text>
                </LinearGradient>
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
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

export default AllFriends;

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#FFF9F0' 
  },
  header: { 
    paddingTop: 20, 
    paddingBottom: 24,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#fff',
    marginBottom: 4,
  },
  headerSub: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.85)',
  },
  addBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -16,
  },
  searchRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 4,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#333',
    fontWeight: '500',
    outlineStyle: 'none' 
  },
  filterRow: { 
    flexDirection: 'row', 
    gap: 10, 
    paddingHorizontal: 16, 
    paddingVertical: 16,
  },
  pill: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    backgroundColor: '#fff',
    borderWidth: 2, 
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillActive: { 
    backgroundColor: '#FF6B6B', 
    borderColor: '#FF6B6B',
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#666',
  },
  pillTextActive: { 
    color: '#fff' 
  },
  list: { 
    paddingHorizontal: 16, 
    paddingBottom: 32,
    paddingTop: 8,
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 16,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 3,
  },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#FFE5E5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14, 
    position: 'relative',
  },
  avatarContact: { 
    backgroundColor: '#FFF3CD' 
  },
  avatarImg: { 
    width: 56, 
    height: 56, 
    borderRadius: 28 
  },
  avatarInitials: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#FF6B6B' 
  },
  typeDot: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: '#fff',
  },
  typeDotUser: { 
    backgroundColor: '#4ECDC4' 
  },
  typeDotContact: { 
    backgroundColor: '#FFD93D' 
  },
  cardInfo: { 
    flex: 1 
  },
  cardName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#333', 
    marginBottom: 3,
  },
  cardEmail: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 6,
  },
  statusPill: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#FFF9E6', 
    borderRadius: 10, 
    paddingHorizontal: 10, 
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFE5B4',
  },
  statusPillText: { 
    fontSize: 12, 
    color: '#996600', 
    fontWeight: '700',
  },
  cardActions: { 
    flexDirection: 'row', 
    gap: 8,
  },
  actionBtnInvite: { 
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8FFF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnRemove: { 
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 32,
  },
  loadingText: { 
    marginTop: 16, 
    color: '#666', 
    fontSize: 16,
    fontWeight: '500',
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: { 
    color: '#FF6B6B', 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 20,
    fontWeight: '600',
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333', 
    marginBottom: 8, 
    textAlign: 'center',
  },
  emptySubtitle: { 
    fontSize: 15, 
    color: '#666', 
    marginBottom: 24, 
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: { 
    backgroundColor: '#FF6B6B', 
    borderRadius: 25, 
    paddingHorizontal: 32, 
    paddingVertical: 14,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryBtnText: { 
    color: '#fff', 
    fontWeight: '800',
    fontSize: 16,
  },
  addFirstBtn: { 
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addFirstBtnGradient: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10,
    paddingHorizontal: 28, 
    paddingVertical: 16,
  },
  addFirstBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '800',
  },
});