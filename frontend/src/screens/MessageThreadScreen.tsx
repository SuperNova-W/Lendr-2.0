import React, { useCallback, useRef, useState } from 'react';
import { showAlert } from '../lib/alert';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  StatusBar,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import {
  getConversation,
  sendMessage,
  markConversationRead,
  ConversationDetail,
  Message,
} from '../lib/api';
import { ShareLocationModal } from '../components/ShareLocationModal';
import {
  encodeLocationMessage,
  parseLocationMessage,
  mapsUrl,
  SharedLocation,
} from '../lib/location';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const fmtDay = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

type Status = ConversationDetail['request_status'];

const STATUS_TONE: Record<Status, { bg: string; text: string; label: string }> = {
  pending:   { bg: '#FFF4E0', text: '#946200', label: 'Pending' },
  approved:  { bg: COLORS.greenLight, text: COLORS.green, label: 'Approved' },
  active:    { bg: COLORS.greenLight, text: COLORS.green, label: 'Active' },
  returned:  { bg: '#ECECF2', text: '#5A5A6E', label: 'Returned' },
  declined:  { bg: COLORS.redLight, text: COLORS.red, label: 'Declined' },
  cancelled: { bg: '#ECECF2', text: '#5A5A6E', label: 'Cancelled' },
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || '?';
}

export const MessageThreadScreen: React.FC<any> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const token = session?.access_token;
  const myId = session?.user?.id;

  const conversationId: string = route.params?.conversationId;
  // Passed from the list so the header renders instantly while details load.
  const initialOtherName: string | undefined = route.params?.otherName;
  const initialItemTitle: string | undefined = route.params?.itemTitle;

  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [locOpen, setLocOpen] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!token || !conversationId) return;
    try {
      const d = await getConversation(token, conversationId);
      setDetail(d);
      setMessages(d.messages);
      // Mark the other participant's messages read now that we're viewing them.
      markConversationRead(token, conversationId).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, conversationId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onSend() {
    const body = text.trim();
    if (!token || !body || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(token, conversationId, body);
      setMessages(prev => [...prev, msg]);
      setText('');
    } catch (err: any) {
      showAlert('Could not send', err.message ?? 'Something went wrong');
    } finally {
      setSending(false);
    }
  }

  // A shared location is just a message whose body is sentinel-encoded — it goes
  // through the same send endpoint, so threads, previews, and unread counts all
  // work unchanged.
  async function onPickLocation(loc: SharedLocation) {
    setLocOpen(false);
    if (!token || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(token, conversationId, encodeLocationMessage(loc));
      setMessages(prev => [...prev, msg]);
    } catch (err: any) {
      showAlert('Could not share location', err.message ?? 'Something went wrong');
    } finally {
      setSending(false);
    }
  }

  const otherName = detail?.other_user_name ?? initialOtherName ?? 'Conversation';
  const itemTitle = detail?.item_title ?? initialItemTitle;
  const status = detail ? STATUS_TONE[detail.request_status] : null;
  const avatar = detail?.other_user_avatar ?? null;
  const itemPhoto = detail?.item_photos?.[0] ?? null;
  const role = detail?.borrower_id === myId ? 'Borrowing' : 'Lending';
  const canSend = text.trim().length > 0 && !sending;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text1} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerIdentity}>
            <View style={styles.headerAvatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.headerAvatarImg} />
              ) : (
                <Text style={styles.headerAvatarText}>{initials(otherName)}</Text>
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle} numberOfLines={1}>{otherName}</Text>
              {itemTitle ? (
                <Text style={styles.headerSub} numberOfLines={1}>{itemTitle}</Text>
              ) : null}
            </View>
          </View>
        </View>
        {status ? (
          <View style={[styles.headerStatus, { backgroundColor: status.bg }]}>
            <Text style={[styles.headerStatusText, { color: status.text }]}>{status.label}</Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.amber} style={{ marginTop: 60 }} />
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 8,
              width: '100%',
            }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
          >
            {detail ? (
              <View style={styles.contextCard}>
                <View style={styles.contextThumb}>
                  {itemPhoto ? (
                    <Image source={{ uri: itemPhoto }} style={styles.contextThumbImg} />
                  ) : (
                    <Ionicons name="image-outline" size={22} color={COLORS.text3} />
                  )}
                </View>
                <View style={styles.contextBody}>
                  <Text style={styles.contextLabel}>{role}</Text>
                  <Text style={styles.contextTitle} numberOfLines={1}>{detail.item_title}</Text>
                  <Text style={styles.contextMeta} numberOfLines={1}>
                    {fmtDate(detail.start_date)} - {fmtDate(detail.end_date)} · ${Number(detail.total_price)}
                  </Text>
                </View>
                {status ? (
                  <View style={[styles.contextStatus, { backgroundColor: status.bg }]}>
                    <Text style={[styles.contextStatusText, { color: status.text }]}>{status.label}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {messages.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="chatbubbles-outline" size={30} color={COLORS.text3} />
                </View>
                <Text style={styles.emptyTitle}>Start the conversation</Text>
                <Text style={styles.emptyText}>
                  No messages yet. Say hello about {itemTitle ? `“${itemTitle}”` : 'this item'}.
                </Text>
              </View>
            ) : (
              messages.map((m, index) => {
                const mine = m.sender_id === myId;
                const loc = parseLocationMessage(m.body);
                const prev = messages[index - 1];
                const showDay = !prev ||
                  new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
                return (
                  <React.Fragment key={m.id}>
                    {showDay ? (
                      <View style={styles.dayDivider}>
                        <Text style={styles.dayText}>{fmtDay(m.created_at)}</Text>
                      </View>
                    ) : null}
                    <View
                      style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
                    >
                      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                        {loc ? (
                          <Pressable onPress={() => Linking.openURL(mapsUrl(loc))}>
                            <View style={styles.locRow}>
                              <Ionicons name="location" size={16} color={mine ? '#fff' : COLORS.amber} />
                              <Text style={[styles.locName, mine && styles.bubbleTextMine]} numberOfLines={2}>
                                {loc.name ?? 'Shared location'}
                              </Text>
                            </View>
                            {loc.address ? (
                              <Text style={[styles.locAddr, mine && styles.locAddrMine]} numberOfLines={2}>
                                {loc.address}
                              </Text>
                            ) : null}
                            <Text style={[styles.locOpen, mine && styles.locOpenMine]}>Open in Maps</Text>
                          </Pressable>
                        ) : (
                          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.body}</Text>
                        )}
                        <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                          {fmtTime(m.created_at)}
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Composer */}
        <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable
            style={styles.locBtn}
            onPress={() => setLocOpen(true)}
            disabled={sending}
            hitSlop={6}
          >
            <Ionicons name="location-outline" size={22} color={COLORS.text2} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={COLORS.text3}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={onSend}
            disabled={!canSend}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ShareLocationModal
        visible={locOpen}
        onClose={() => setLocOpen(false)}
        onPick={onPickLocation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 10,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.amberLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImg: { width: '100%', height: '100%' },
  headerAvatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: COLORS.amberDark,
  },
  headerText: {
    minWidth: 0,
    maxWidth: '72%',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: COLORS.text1,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 1,
  },
  headerStatus: {
    minWidth: 40,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  headerStatusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },

  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: 18,
  },
  contextThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contextThumbImg: { width: '100%', height: '100%' },
  contextBody: {
    flex: 1,
    minWidth: 0,
  },
  contextLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: COLORS.green,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  contextTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: COLORS.text1,
    marginTop: 2,
  },
  contextMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 2,
  },
  contextStatus: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  contextStatusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: COLORS.text1,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text3,
    textAlign: 'center',
    lineHeight: 21,
  },

  dayDivider: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  dayText: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSub,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: COLORS.text3,
  },

  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: COLORS.amber,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.surfaceSub,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.text1,
    lineHeight: 21,
  },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: COLORS.text3,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
    width: '100%',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 11 : 8,
    paddingBottom: Platform.OS === 'ios' ? 11 : 8,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceInput,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.text1,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.text3 },
  locBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceInput,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Shared-location card (rendered inside a normal message bubble)
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locName: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: COLORS.text1,
  },
  locAddr: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text2,
    marginTop: 3,
  },
  locAddrMine: { color: 'rgba(255,255,255,0.85)' },
  locOpen: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: COLORS.amber,
    marginTop: 8,
  },
  locOpenMine: { color: '#fff', textDecorationLine: 'underline' },
});
