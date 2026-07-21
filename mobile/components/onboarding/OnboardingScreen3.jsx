import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#F6921D';
const TEXT = '#111827';
const TEXT_SECONDARY = '#4B5563';
const CARD_BG = '#FFFFFF';
const BORDER = '#E5E7EB';
const INPUT_BG = '#F9FAFB';
const CAL_COLOR = '#F97316';
const PROTEIN_COLOR = '#22C55E';
const CARBS_COLOR = '#3B82F6';
const FAT_COLOR = '#A855F7';

// Placeholder analytics data
const MOCK_AVERAGES = { calories: 2100, protein: 145, carbs: 220, fat: 72 };
const MOCK_DAY_CALS = [1900, 2200, 2050, 2300, 1980, 2150, 2000]; // Mon–Sun
const MOCK_MACROS = [
  { name: 'Protein', grams: 145, pct: 28, color: '#22c55e' },
  { name: 'Carbs', grams: 220, pct: 42, color: '#3b82f6' },
  { name: 'Fat', grams: 72, pct: 30, color: '#a855f7' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function MockAnalyticsModal() {
  const maxCal = Math.max(...MOCK_DAY_CALS, 1);
  return (
    <View style={modalStyles.modal}>
      <View style={modalStyles.header}>
        <View style={modalStyles.headerLeft}>
          <Ionicons name="bar-chart-outline" size={18} color={PRIMARY} />
          <Text style={modalStyles.headerTitle}>Weekly Analytics</Text>
        </View>
      </View>

      <View style={modalStyles.body}>
        <Text style={modalStyles.sectionTitle}>Daily Averages (7 days)</Text>
        <View style={modalStyles.summaryGrid}>
          <View style={[modalStyles.summaryCard, modalStyles.caloriesCard]}>
            <Ionicons name="flame-outline" size={16} color={CAL_COLOR} />
            <Text style={[modalStyles.summaryValue, modalStyles.caloriesValue]}>
              {MOCK_AVERAGES.calories}
            </Text>
            <Text style={modalStyles.summaryLabel}>calories</Text>
          </View>
          <View style={[modalStyles.summaryCard, modalStyles.proteinCard]}>
            <Ionicons name="barbell-outline" size={16} color={PROTEIN_COLOR} />
            <Text style={[modalStyles.summaryValue, modalStyles.proteinValue]}>
              {MOCK_AVERAGES.protein}g
            </Text>
            <Text style={modalStyles.summaryLabel}>protein</Text>
          </View>
          <View style={[modalStyles.summaryCard, modalStyles.carbsCard]}>
            <Ionicons name="restaurant-outline" size={16} color={CARBS_COLOR} />
            <Text style={[modalStyles.summaryValue, modalStyles.carbsValue]}>
              {MOCK_AVERAGES.carbs}g
            </Text>
            <Text style={modalStyles.summaryLabel}>carbs</Text>
          </View>
          <View style={[modalStyles.summaryCard, modalStyles.fatCard]}>
            <Ionicons name="water-outline" size={16} color={FAT_COLOR} />
            <Text style={[modalStyles.summaryValue, modalStyles.fatValue]}>
              {MOCK_AVERAGES.fat}g
            </Text>
            <Text style={modalStyles.summaryLabel}>fat</Text>
          </View>
        </View>

        <Text style={modalStyles.sectionTitle}>Daily Calories</Text>
        <View style={modalStyles.barChart}>
          {MOCK_DAY_CALS.map((cal, i) => {
            const barHeight = Math.max(4, (cal / maxCal) * 56);
            return (
              <View key={i} style={modalStyles.barItem}>
                <View style={modalStyles.barTrack}>
                  <View
                    style={[modalStyles.barFill, { height: barHeight }]}
                  />
                </View>
                <Text style={modalStyles.barLabel}>{DAYS[i]}</Text>
                <Text style={modalStyles.barValue}>{cal}</Text>
              </View>
            );
          })}
        </View>

        <Text style={modalStyles.sectionTitle}>Macro Distribution</Text>
        <View style={modalStyles.macroList}>
          {MOCK_MACROS.map((m, i) => (
            <View key={i} style={modalStyles.macroRow}>
              <View style={modalStyles.macroLeft}>
                <View style={[modalStyles.macroDot, { backgroundColor: m.color }]} />
                <Text style={modalStyles.macroName}>{m.name}</Text>
              </View>
              <View style={modalStyles.macroRight}>
                <Text style={modalStyles.macroGrams}>{m.grams}g</Text>
                <Text style={modalStyles.macroPct}>({m.pct}%)</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  modal: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: INPUT_BG,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT,
  },
  body: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    width: '47%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    gap: 2,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD_BG,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  caloriesValue: { color: CAL_COLOR },
  proteinValue: { color: PROTEIN_COLOR },
  carbsValue: { color: CARBS_COLOR },
  fatValue: { color: FAT_COLOR },
  caloriesCard: {},
  proteinCard: {},
  carbsCard: {},
  fatCard: {},
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 88,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  barTrack: {
    width: '70%',
    height: 56,
    backgroundColor: BORDER,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 4,
    minHeight: 4,
    alignSelf: 'flex-end',
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
  },
  barValue: {
    fontSize: 9,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  macroList: {
    gap: 6,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: INPUT_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  macroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  macroName: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT,
  },
  macroRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroGrams: {
    fontSize: 12,
    fontWeight: '800',
    color: TEXT,
  },
  macroPct: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
});

export function OnboardingScreen3() {
  return (
    <View style={styles.container}>
      <Text style={styles.headline}>
        Track Progress Toward Your Goals
      </Text>
      <View style={styles.mockupWrap}>
        <MockAnalyticsModal />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  subtext: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  mockupWrap: {
    width: '100%',
    alignItems: 'center',
  },
});
