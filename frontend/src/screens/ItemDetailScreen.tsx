import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

export const ItemDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { item } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Item Details</Text>
        <View style={{ width: 40 }} /> {/* Spacer to balance back button */}
      </View>

      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* ── Image/Emoji ── */}
        <View style={styles.imageContainer}>
          <Text style={styles.imageEmoji}>{item.emoji}</Text>
        </View>

        {/* ── Info ── */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>{item.price}</Text>
            </View>
          </View>
          
          <Text style={styles.tagText}>{item.tag || 'Item'}</Text>
          
          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.desc}>{item.desc}</Text>
          
          <View style={styles.divider} />

          {/* Dummy info for realism */}
          <Text style={styles.sectionTitle}>Lender Information</Text>
          <View style={styles.lenderCard}>
            <View style={styles.lenderAvatar}>
              <Text style={styles.lenderAvatarText}>S</Text>
            </View>
            <View style={styles.lenderInfo}>
              <Text style={styles.lenderName}>Sarah Johnson</Text>
              <Text style={styles.lenderStats}>⭐ 4.9 • 14 items lent</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Action ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable style={styles.borrowBtn}>
          <Text style={styles.borrowBtnText}>Request to Borrow</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
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
  backIcon: {
    fontSize: 20,
    color: COLORS.text1,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: COLORS.text1,
  },
  imageContainer: {
    margin: 24,
    height: 250,
    backgroundColor: COLORS.surfaceSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: {
    fontSize: 100,
  },
  infoSection: {
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: COLORS.text1,
    lineHeight: 30,
  },
  pricePill: {
    backgroundColor: COLORS.greenLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  priceText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: COLORS.green,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.text3,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: COLORS.text1,
    marginBottom: 12,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.text2,
    lineHeight: 24,
  },
  lenderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  lenderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lenderAvatarText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: COLORS.amberDark,
  },
  lenderInfo: {
    flex: 1,
  },
  lenderName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: COLORS.text1,
  },
  lenderStats: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  borrowBtn: {
    backgroundColor: COLORS.amber,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#fff',
  },
});
