import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { apiClient } from '../../../../shared/services/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

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
    backgroundColor: colors.inputBackground,
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
  progressContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  progressStepTextActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
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
  stepContainer: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepTitleBold: {
    fontWeight: '800',
    color: colors.text,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
  },
  mealTypeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.inputBackground,
  },
  mealTypeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  mealTypeTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickSelectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.inputBackground,
  },
  quickSelectText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  fullWidthButton: {
    width: '100%',
    marginTop: 8,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
  },
  optionContent: {
    gap: 8,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  macrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  macroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  macroBadgeCalories: {
    backgroundColor: '#FEF3C7',
  },
  macroBadgeProtein: {
    backgroundColor: '#D1FAE5',
  },
  macroBadgeCarbs: {
    backgroundColor: '#DBEAFE',
  },
  macroBadgeFat: {
    backgroundColor: '#EDE9FE',
  },
  macroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  prepInfoRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
    alignItems: 'flex-start',
  },
  prepInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  prepInfoItemReason: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  prepInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 12,
  },
  successText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.success,
  },
});

export const MealPrepModal = ({
  visible,
  onClose,
  onApply,
  userProfile,
  foodPreferences,
  isGuest,
}) => {
  const [step, setStep] = useState(1); // 1: meal type, 2: days, 3: options
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [selectedDays, setSelectedDays] = useState([]);
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectWeekdays = () => {
    setSelectedDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  };

  const selectAll = () => {
    setSelectedDays([...DAYS]);
  };

  const handleGenerateOptions = async () => {
    if (selectedDays.length === 0) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await apiClient.generateMealPrep({
        mealType: selectedMealType,
        days: selectedDays,
        userProfile,
        foodPreferences,
      });

      if (result.success && result.options?.length > 0) {
        setOptions(result.options);
        setStep(3);
      } else {
        throw new Error(result.error || 'Failed to generate options');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate meal prep options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = async (option) => {
    // Apply to all selected days
    selectedDays.forEach((day) => {
      onApply(day, selectedMealType, option.fullDescription);
    });

    setApplied(true);
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedMealType('lunch');
    setSelectedDays([]);
    setOptions([]);
    setError('');
    setApplied(false);
    onClose();
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

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
                <Ionicons name="restaurant" size={22} color={colors.primary} />
                <Text style={styles.headerTitle}>Meal Prep Mode</Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <View
                      style={[
                        styles.progressStep,
                        step >= s && styles.progressStepActive,
                      ]}
                    >
                      {step > s ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : (
                        <Text
                          style={[
                            styles.progressStepText,
                            step >= s && styles.progressStepTextActive,
                          ]}
                        >
                          {s}
                        </Text>
                      )}
                    </View>
                    {s < 3 && (
                      <View
                        style={[
                          styles.progressLine,
                          step > s && styles.progressLineActive,
                        ]}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Meal Type</Text>
                <Text style={styles.progressLabel}>Days</Text>
                <Text style={styles.progressLabel}>Choose</Text>
              </View>
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
              {/* Step 1: Select Meal Type */}
              {step === 1 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Which meal do you want to prep?</Text>
                  <View style={styles.mealTypeGrid}>
                    {MEAL_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setSelectedMealType(type)}
                        style={[
                          styles.mealTypeButton,
                          selectedMealType === type && styles.mealTypeButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.mealTypeText,
                            selectedMealType === type && styles.mealTypeTextActive,
                          ]}
                        >
                          {capitalize(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setStep(2)}
                  >
                    <Text style={styles.primaryButtonText}>Next: Select Days</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 2: Select Days */}
              {step === 2 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>
                    Which days will you eat this prepped{' '}
                    <Text style={styles.stepTitleBold}>{selectedMealType}</Text>?
                  </Text>

                  <View style={styles.quickSelectRow}>
                    <TouchableOpacity
                      style={styles.quickSelectButton}
                      onPress={selectWeekdays}
                    >
                      <Text style={styles.quickSelectText}>Weekdays</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.quickSelectButton}
                      onPress={selectAll}
                    >
                      <Text style={styles.quickSelectText}>All Week</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.quickSelectButton}
                      onPress={() => setSelectedDays([])}
                    >
                      <Text style={styles.quickSelectText}>Clear</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.daysGrid}>
                    {DAYS.map((day) => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => toggleDay(day)}
                        style={[
                          styles.dayButton,
                          selectedDays.includes(day) && styles.dayButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            selectedDays.includes(day) && styles.dayButtonTextActive,
                          ]}
                        >
                          {capitalize(day)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={handleBack}
                    >
                      <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
                      <Text style={styles.secondaryButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        (selectedDays.length === 0 || isLoading) && styles.primaryButtonDisabled,
                      ]}
                      onPress={handleGenerateOptions}
                      disabled={selectedDays.length === 0 || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={styles.primaryButtonText}>Generating...</Text>
                        </>
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          Generate Options ({selectedDays.length} days)
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Step 3: Choose Option */}
              {step === 3 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>
                    Choose a meal prep option for{' '}
                    <Text style={styles.stepTitleBold}>{selectedMealType}</Text> on{' '}
                    <Text style={styles.stepTitleBold}>{selectedDays.length} days</Text>:
                  </Text>

                  <View style={styles.optionsList}>
                    {options.map((option, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.optionCard}
                        onPress={() => !applied && handleSelectOption(option)}
                        disabled={applied}
                      >
                        <View style={styles.optionContent}>
                          <Text style={styles.optionName}>{option.name}</Text>
                          <Text style={styles.optionDescription}>{option.description}</Text>

                          {/* Macros */}
                          {option.macros && (
                            <View style={styles.macrosRow}>
                              <View style={[styles.macroBadge, styles.macroBadgeCalories]}>
                                <Text style={styles.macroBadgeText}>
                                  {option.macros.calories} cal
                                </Text>
                              </View>
                              <View style={[styles.macroBadge, styles.macroBadgeProtein]}>
                                <Text style={styles.macroBadgeText}>
                                  {option.macros.protein}g P
                                </Text>
                              </View>
                              <View style={[styles.macroBadge, styles.macroBadgeCarbs]}>
                                <Text style={styles.macroBadgeText}>
                                  {option.macros.carbs}g C
                                </Text>
                              </View>
                              <View style={[styles.macroBadge, styles.macroBadgeFat]}>
                                <Text style={styles.macroBadgeText}>
                                  {option.macros.fat}g F
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Prep info */}
                          <View style={styles.prepInfoRow}>
                            <View style={styles.prepInfoItem}>
                              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                              <Text style={styles.prepInfoText}>{option.prepTime}</Text>
                            </View>
                            <View style={[styles.prepInfoItem, styles.prepInfoItemReason]}>
                              <Ionicons name="restaurant-outline" size={14} color={colors.textSecondary} />
                              <Text style={styles.prepInfoText} numberOfLines={0}>
                                {option.prepReason}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {applied && (
                    <View style={styles.successContainer}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                      <Text style={styles.successText}>
                        Applied to {selectedDays.length} days!
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.fullWidthButton]}
                    onPress={handleBack}
                    disabled={applied}
                  >
                    <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
                    <Text style={styles.secondaryButtonText}>Back to Days</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

