import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { parseMeal } from '../../../utils/mealHelpers';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

/**
 * Manual snack logger: name + macros. Calls onSubmit; parent hits /api/log-snack.
 * Centered dialog + KeyboardAvoidingView so fields stay above the keyboard.
 */
export const LogSnackModal = ({
  visible,
  onClose,
  onSubmit,
  onDelete,
  defaultDay = 'monday',
  existingSnack = '',
  snacksUserLogged = false,
  submitting = false,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSelectedDay(defaultDay);
    if (snacksUserLogged && existingSnack) {
      const parsed = parseMeal(existingSnack);
      setName(parsed.name || '');
      setCalories(parsed.calories ? String(parsed.calories) : '');
      setProtein(parsed.protein ? String(parsed.protein) : '');
      setCarbs(parsed.carbs ? String(parsed.carbs) : '');
      setFat(parsed.fat ? String(parsed.fat) : '');
    } else {
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
    }
  }, [visible, defaultDay, existingSnack, snacksUserLogged]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Enter a snack name.');
      return;
    }
    const macros = {
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
    };
    if (!Number.isFinite(macros.calories) || macros.calories < 1) {
      Alert.alert('Invalid macros', 'Calories must be at least 1.');
      return;
    }
    for (const key of ['protein', 'carbs', 'fat']) {
      if (!Number.isFinite(macros[key]) || macros[key] < 0) {
        Alert.alert('Invalid macros', `${key} must be a non-negative number.`);
        return;
      }
    }
    onSubmit({ day: selectedDay, name: trimmed, ...macros });
  };

  const handleDelete = () => {
    Alert.alert('Remove snack?', 'This will clear the snack and restore meal targets.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => onDelete?.({ day: selectedDay }),
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {snacksUserLogged ? 'Edit Snack' : 'Log Snack'}
              </Text>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={styles.label}>Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
                {DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
                    onPress={() => setSelectedDay(d)}
                  >
                    <Text
                      style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}
                    >
                      {DAY_LABELS[d]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Snack name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Greek yogurt"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="sentences"
              />

              <Text style={styles.label}>Macros</Text>
              <View style={styles.macroRow}>
                {[
                  { key: 'calories', label: 'Cal', value: calories, set: setCalories },
                  { key: 'protein', label: 'P (g)', value: protein, set: setProtein },
                  { key: 'carbs', label: 'C (g)', value: carbs, set: setCarbs },
                  { key: 'fat', label: 'F (g)', value: fat, set: setFat },
                ].map((field) => (
                  <View key={field.key} style={styles.macroField}>
                    <Text style={styles.macroLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.macroInput}
                      value={field.value}
                      onChangeText={field.set}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              {snacksUserLogged ? (
                <>
                  <TouchableOpacity
                    style={[styles.footerBtn, styles.deleteBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleDelete}
                    disabled={submitting}
                  >
                    <Text style={styles.deleteBtnText}>Remove</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.footerBtn,
                      styles.submitBtn,
                      (!name.trim() || submitting) && styles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!name.trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Update Snack</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.footerBtn,
                    styles.submitBtn,
                    styles.submitBtnSingle,
                    (!name.trim() || submitting) && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!name.trim() || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Log Snack</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    keyboardAvoiding: {
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    dialog: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '90%',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    body: {
      padding: 16,
      paddingBottom: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      marginTop: 12,
    },
    dayRow: {
      flexGrow: 0,
      marginBottom: 4,
    },
    dayChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary || colors.border,
      marginRight: 8,
    },
    dayChipActive: {
      backgroundColor: colors.primary,
    },
    dayChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    dayChipTextActive: {
      color: '#fff',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background || colors.cardBackground,
    },
    macroRow: {
      flexDirection: 'row',
      gap: 8,
    },
    macroField: {
      flex: 1,
    },
    macroLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textTertiary,
      marginBottom: 4,
    },
    macroInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteBtn: {
      backgroundColor: colors.error || '#c0392b',
    },
    deleteBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    submitBtn: {
      backgroundColor: colors.primary,
    },
    submitBtnSingle: {
      flex: 0,
      minWidth: 180,
    },
    submitBtnDisabled: {
      opacity: 0.45,
    },
    submitBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
  });
