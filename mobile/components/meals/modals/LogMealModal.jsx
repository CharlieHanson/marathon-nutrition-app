import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { apiClient } from '../../../../shared/services/api';

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
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];
const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
  dessert: 'Dessert',
};

const getStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    overflow: 'hidden',
    zIndex: 1,
  },
  modalInner: {
    flex: 1,
    flexDirection: 'column',
    pointerEvents: 'auto',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  content: {
    flex: 1,
    minHeight: 0,
    flexShrink: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  dayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  mealTypeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTypeButtonSelected: {
    backgroundColor: colors.primary,
  },
  mealTypeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  mealTypeButtonTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    width: '100%',
    minHeight: 100,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.inputBackground,
  },
  helperText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 6,
  },
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    marginBottom: 16,
  },
  estimateButtonDisabled: {
    opacity: 0.5,
  },
  estimateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  macrosContainer: {
    padding: 12,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 8,
    marginBottom: 16,
  },
  macrosTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 10,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  macroChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  macroChipCalories: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  macroChipProtein: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  macroChipCarbs: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  macroChipFat: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  macroChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  macroChipValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  logButtonDisabled: {
    backgroundColor: colors.borderLight,
    opacity: 0.6,
  },
  logButtonSuccess: {
    backgroundColor: colors.success,
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export const LogMealModal = ({
  visible,
  onClose,
  onLog,
  defaultDay,
  defaultMealType,
  isGuest,
}) => {
  const [mealDescription, setMealDescription] = useState('');
  const [selectedDay, setSelectedDay] = useState(defaultDay || 'monday');
  const [selectedMealType, setSelectedMealType] = useState(defaultMealType || 'lunch');
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedMacros, setEstimatedMacros] = useState(null);
  const [logged, setLogged] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Update defaults when they change
  useEffect(() => {
    if (defaultDay) setSelectedDay(defaultDay);
    if (defaultMealType) setSelectedMealType(defaultMealType);
  }, [defaultDay, defaultMealType]);

  const handleEstimateMacros = async () => {
    if (!mealDescription.trim()) return;

    setIsEstimating(true);
    setEstimatedMacros(null);

    try {
      const result = await apiClient.estimateMacros({
        meal: mealDescription.trim(),
        mealType: selectedMealType,
      });

      if (result.success && result.macros) {
        setEstimatedMacros(result.macros);
      }
    } catch (error) {
      console.error('Failed to estimate macros:', error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleLog = async () => {
    if (!mealDescription.trim()) return;

    setIsEstimating(true);
    setLogged(false);

    try {
      const result = await apiClient.estimateMacros({
        meal: mealDescription.trim(),
        mealType: selectedMealType,
      });

      const finalMeal = result.success && result.meal ? result.meal : mealDescription.trim();
      onLog(selectedDay, selectedMealType, finalMeal);
      setLogged(true);

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to log meal:', error);
      // Log without macros if estimation fails
      onLog(selectedDay, selectedMealType, mealDescription.trim());
      setLogged(true);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleClose = () => {
    setMealDescription('');
    setLogged(false);
    setEstimatedMacros(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable onPress={handleClose} style={styles.overlayPressable} />
        <View style={styles.modalContent}>
          <View style={styles.modalInner}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
                <Text style={styles.headerTitle}>Log Meal</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}
              scrollEventThrottle={16}
            >
              {/* Day Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Which day?</Text>
                <View style={styles.dayGrid}>
                  {DAYS.map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setSelectedDay(day)}
                      style={[
                        styles.dayButton,
                        selectedDay === day && styles.dayButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          selectedDay === day && styles.dayButtonTextSelected,
                        ]}
                      >
                        {DAY_LABELS[day]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Meal Type Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Which meal?</Text>
                <View style={styles.mealTypeGrid}>
                  {MEAL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        setSelectedMealType(type);
                        setEstimatedMacros(null);
                      }}
                      style={[
                        styles.mealTypeButton,
                        selectedMealType === type && styles.mealTypeButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.mealTypeButtonText,
                          selectedMealType === type && styles.mealTypeButtonTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {MEAL_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Meal Description */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>What did you eat?</Text>
                <TextInput
                  value={mealDescription}
                  onChangeText={(text) => {
                    setMealDescription(text);
                    setEstimatedMacros(null);
                  }}
                  placeholder="e.g., Grilled chicken salad with olive oil dressing, side of brown rice..."
                  placeholderTextColor={colors.textTertiary}
                  style={styles.textInput}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Text style={styles.helperText}>
                  Be descriptive for better macro estimates
                </Text>
              </View>

              {/* Estimate Macros Button */}
              {mealDescription.trim() && !estimatedMacros && (
                <TouchableOpacity
                  onPress={handleEstimateMacros}
                  disabled={isEstimating}
                  style={[styles.estimateButton, isEstimating && styles.estimateButtonDisabled]}
                >
                  {isEstimating ? (
                    <>
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                      <Text style={styles.estimateButtonText}>Estimating...</Text>
                    </>
                  ) : (
                    <Text style={styles.estimateButtonText}>Preview Macro Estimate</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Estimated Macros Display */}
              {estimatedMacros && (
                <View style={styles.macrosContainer}>
                  <Text style={styles.macrosTitle}>Estimated Macros:</Text>
                  <View style={styles.macrosGrid}>
                    <View style={[styles.macroChip, styles.macroChipCalories]}>
                      <Text style={styles.macroChipLabel}>Cal</Text>
                      <Text style={styles.macroChipValue}>{estimatedMacros.calories}</Text>
                    </View>
                    <View style={[styles.macroChip, styles.macroChipProtein]}>
                      <Text style={styles.macroChipLabel}>P</Text>
                      <Text style={styles.macroChipValue}>{estimatedMacros.protein}g</Text>
                    </View>
                    <View style={[styles.macroChip, styles.macroChipCarbs]}>
                      <Text style={styles.macroChipLabel}>C</Text>
                      <Text style={styles.macroChipValue}>{estimatedMacros.carbs}g</Text>
                    </View>
                    <View style={[styles.macroChip, styles.macroChipFat]}>
                      <Text style={styles.macroChipLabel}>F</Text>
                      <Text style={styles.macroChipValue}>{estimatedMacros.fat}g</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Log Meal Button */}
              <TouchableOpacity
                onPress={handleLog}
                disabled={!mealDescription.trim() || logged || isEstimating}
                style={[
                  styles.logButton,
                  (!mealDescription.trim() || isEstimating) && styles.logButtonDisabled,
                  logged && styles.logButtonSuccess,
                ]}
              >
                {logged ? (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.logButtonText}>Logged!</Text>
                  </>
                ) : isEstimating ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.logButtonText}>Estimating macros...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="restaurant" size={20} color="#FFFFFF" />
                    <Text style={styles.logButtonText}>Log Meal</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};