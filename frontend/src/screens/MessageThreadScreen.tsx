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
          <Text style={styles.headerTitle} numberOfLines={1}>{otherName}</Text>
          {itemTitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>{itemTitle}</Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
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
            {messages.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  No messages yet. Say hello about {itemTitle ? `“${itemTitle}”` : 'this item'}.
                </Text>
              </View>
            ) : (
              messages.map(m => {
                const mine = m.sender_id === myId;
                const loc = parseLocationMessage(m.body);
                return (
                  <View
                    key={m.id}
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
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: COLORS.text1,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 1,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text3,
    textAlign: 'center',
    lineHeight: 21,
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
