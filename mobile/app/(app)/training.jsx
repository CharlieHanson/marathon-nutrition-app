import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { useTheme } from '../../context/ThemeContext';
import { useTrainingPlan } from '../../hooks/useTrainingPlan';
import { ErrorState } from '../../components/ErrorState';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WORKOUT_TYPES = [
  'Rest',
  'Distance Run',
  'Speed or Agility Training',
  'Bike Ride',
  'Walk/Hike',
  'Swim',
  'Strength Training',
  'Sport Practice',
];

const INTENSITY_LEVELS = ['High', 'Medium', 'Low', 'Recovery'];

const WORKOUT_TIMING_OPTIONS = ['—', 'Morning', 'Afternoon', 'Evening'];

const DEFAULT_WORKOUT = {
  type: '',
  distance: '',
  intensity: 'Medium',
  notes: '',
  timing: '',
};

// Picker styles function
const getPickerStyles = (colors) => StyleSheet.create({
  pickerOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  pickerOptions: {
    maxHeight: 400,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
});

// Simple Picker component using Modal
const Picker = ({ visible, options, selectedValue, onValueChange, onClose, title }) => {
  const { colors } = useTheme();
  const pickerStyles = getPickerStyles(colors);
  
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pickerStyles.pickerOverlay} onPress={onClose}>
        <Pressable style={pickerStyles.pickerContainer} onPress={() => {}}>
          <View style={pickerStyles.pickerHeader}>
            <Text style={pickerStyles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={pickerStyles.pickerOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  pickerStyles.pickerOption,
                  selectedValue === option && pickerStyles.pickerOptionSelected,
                ]}
                onPress={() => {
                  onValueChange(option);
                  onClose();
                }}
              >
                <Text
                  style={[
                    pickerStyles.pickerOptionText,
                    selectedValue === option && pickerStyles.pickerOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {selectedValue === option && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const getWorkoutIcon = (type) => {
  switch (type) {
    case 'Swim':
      return 'water-outline';
    case 'Bike Ride':
      return 'bicycle-outline';
    case 'Strength Training':
      return 'barbell-outline';
    case 'Distance Run':
    case 'Walk/Hike':
      return 'walk-outline';
    case 'Speed or Agility Training':
      return 'flash-outline';
    default:
      return 'fitness-outline';
  }
};

const getIntensityColor = (intensity) => {
  switch (intensity) {
    case 'High':
      return '#DC2626'; // red
    case 'Medium':
      return '#F6921D'; // orange
    case 'Low':
      return '#3B82F6'; // blue
    case 'Recovery':
      return '#10B981'; // green
    default:
      return '#9CA3AF'; // gray
  }
};

const getCurrentDay = () => {
  const today = new Date().getDay();
  return DAYS[today === 0 ? 6 : today - 1];
};

const getPlanDateLabel = (plan) => {
  const createdAt = plan.created_at ? new Date(plan.created_at) : null;
  const updatedAt = plan.updated_at ? new Date(plan.updated_at) : null;

  if (updatedAt && createdAt && updatedAt > createdAt) {
    return `Updated ${updatedAt.toLocaleDateString()}`;
  }

  if (createdAt) {
    return `Created ${createdAt.toLocaleDateString()}`;
  }

  return '';
};

const getWeekDateNumbers = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  return DAYS.map((_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date.getDate();
  });
};

export default function TrainingScreen() {
  const { user, isGuest } = useAuth();
  const { isConnected } = useNetwork();
  const { colors } = useTheme();
  const trainingPlanHook = useTrainingPlan(user, isGuest);

  const [planName, setPlanName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showIntensityPicker, setShowIntensityPicker] = useState(false);
  const [showTimingPicker, setShowTimingPicker] = useState(false);
  const [pickerContext, setPickerContext] = useState({ day: null, index: null, field: null });
  const [selectedDay, setSelectedDay] = useState(getCurrentDay);
  const weekDates = useMemo(getWeekDateNumbers, []);
  const todayDay = getCurrentDay();

  useEffect(() => {
    setPlanName(trainingPlanHook.currentPlanName || '');
  }, [trainingPlanHook.currentPlanName]);

  const handleSave = async () => {
    if (isConnected === false) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.');
      return;
    }
    const nameToUse = planName.trim() || 'Untitled Plan';
    const { error } = await trainingPlanHook.savePlan(nameToUse);

    if (!error) {
      setShowSaveModal(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } else {
      Alert.alert('Error', 'Failed to save training plan');
    }
  };

  const MAX_SAVED_PLANS = 10;

  const handleLoadClick = async () => {
    await trainingPlanHook.loadSavedPlans();
    setShowLoadModal(true);
  };

  const handleCreateNewPlan = async () => {
    const currentPlans = await trainingPlanHook.loadSavedPlans();
    if (currentPlans.length >= MAX_SAVED_PLANS) {
      Alert.alert(
        'Plan Limit Reached',
        `You can save up to ${MAX_SAVED_PLANS} training plans. Delete one or more plans before creating a new one.`,
        [{ text: 'OK' }]
      );
      return;
    }
    trainingPlanHook.createNewPlan();
  };

  const handleLoadPlan = async (planId) => {
    const { error } = await trainingPlanHook.loadPlan(planId);
    if (!error) {
      setShowLoadModal(false);
    } else {
      Alert.alert('Error', 'Failed to load training plan');
    }
  };

  const handleDelete = (planId, planNameToDelete) => {
    Alert.alert(
      'Delete Plan',
      `Delete "${planNameToDelete}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await trainingPlanHook.deletePlan(planId);
            if (error) {
              Alert.alert('Error', 'Failed to delete training plan');
            }
          },
        },
      ]
    );
  };

  const addWorkout = (day) => {
    const existing = trainingPlanHook.plan[day]?.workouts || [];
    trainingPlanHook.updatePlan(day, 'workouts', [...existing, { ...DEFAULT_WORKOUT }]);
  };

  const removeWorkout = (day, index) => {
    const workouts = [...(trainingPlanHook.plan[day]?.workouts || [])];
    workouts.splice(index, 1);
    trainingPlanHook.updatePlan(
      day,
      'workouts',
      workouts.length ? workouts : [{ ...DEFAULT_WORKOUT }]
    );
  };

  const updateWorkout = (day, index, field, value) => {
    const workouts = [...(trainingPlanHook.plan[day]?.workouts || [{ ...DEFAULT_WORKOUT }])];
    workouts[index] = { ...workouts[index], [field]: value };
    trainingPlanHook.updatePlan(day, 'workouts', workouts);
  };

  const openPicker = (day, index, field, options) => {
    setPickerContext({ day, index, field, options });
    if (field === 'type') {
      setShowTypePicker(true);
    } else if (field === 'intensity') {
      setShowIntensityPicker(true);
    } else if (field === 'timing') {
      setShowTimingPicker(true);
    }
  };

  const handlePickerValueChange = (value) => {
    if (pickerContext.day && pickerContext.index !== null) {
      const stored = pickerContext.field === 'timing' && value === '—' ? '' : value;
      updateWorkout(pickerContext.day, pickerContext.index, pickerContext.field, stored);
    }
  };


  const styles = getStyles(colors);

  const selectedDayData = trainingPlanHook.plan[selectedDay] || { workouts: [{ ...DEFAULT_WORKOUT }] };
  const selectedWorkouts = selectedDayData.workouts?.length
    ? selectedDayData.workouts
    : [{ ...DEFAULT_WORKOUT }];
  const addWorkoutLabel = selectedWorkouts.length > 1 ? 'Add another workout' : 'Add workout';

  if (trainingPlanHook.fetchError && !trainingPlanHook.isLoading) {
    return (
      <ErrorState
        message={trainingPlanHook.fetchError}
        onRetry={trainingPlanHook.refetchTrainingPlan}
      />
    );
  }

  if (trainingPlanHook.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading training plan…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.trainingHeader}>
        <View style={styles.planControlRow}>
          <View style={styles.planInfo}>
            <View style={styles.planTitleRow}>
              <Text style={styles.planTitle} numberOfLines={1}>
                {trainingPlanHook.currentPlanName || 'New Training Plan'}
              </Text>
              {trainingPlanHook.isLoadedSavedPlan ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              ) : null}
              {showConfirmation ? (
                <View style={styles.savedConfirmationPill}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                  <Text style={styles.savedConfirmationText}>Saved</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerActionButton, styles.headerActionButtonSecondary]}
              onPress={handleCreateNewPlan}
              accessibilityLabel="New plan"
              accessibilityRole="button"
              hitSlop={{ top: 3, bottom: 3, left: 3, right: 3 }}
            >
              <Ionicons name="add" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerActionButton, styles.headerActionButtonSecondary]}
              onPress={handleLoadClick}
              accessibilityLabel="Load plan"
              accessibilityRole="button"
              hitSlop={{ top: 3, bottom: 3, left: 3, right: 3 }}
            >
              <Ionicons name="folder-open-outline" size={20} color={colors.info} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerActionButton, styles.headerActionButtonPrimary]}
              onPress={() => setShowSaveModal(true)}
              disabled={trainingPlanHook.isSaving}
              accessibilityLabel={trainingPlanHook.isSaving ? 'Saving plan' : 'Save plan'}
              accessibilityRole="button"
              hitSlop={{ top: 3, bottom: 3, left: 3, right: 3 }}
            >
              {trainingPlanHook.isSaving ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Ionicons name="save-outline" size={20} color={colors.textInverse} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.calendarRow}>
          {DAYS.map((day, index) => {
            const isSelected = selectedDay === day;
            const isToday = day === todayDay;

            return (
              <TouchableOpacity
                key={day}
                style={styles.calendarDay}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
                accessibilityLabel={`${DAY_LABELS[index]}, ${weekDates[index]}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.calendarWeekday,
                    isSelected && styles.calendarWeekdaySelected,
                  ]}
                >
                  {DAY_LABELS[index].toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.calendarDateCircle,
                    isSelected && styles.calendarDateCircleSelected,
                    isToday && !isSelected && styles.calendarDateCircleToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDateText,
                      isSelected && styles.calendarDateTextSelected,
                      isToday && !isSelected && styles.calendarDateTextToday,
                    ]}
                  >
                    {weekDates[index]}
                  </Text>
                </View>
                {isToday && !isSelected ? <View style={styles.todayDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.workoutsContainer}>
          {selectedWorkouts.map((workout, index) => (
            <View
              key={index}
              style={[
                styles.workoutCard,
                { borderLeftColor: getIntensityColor(workout.intensity || 'Medium') },
              ]}
            >
              <TouchableOpacity
                style={styles.workoutField}
                onPress={() => openPicker(selectedDay, index, 'type', WORKOUT_TYPES)}
              >
                <Text style={styles.workoutFieldLabel}>Workout Type</Text>
                <View style={styles.workoutFieldValue}>
                  {workout.type ? (
                    <View style={styles.workoutTypeRow}>
                      <Ionicons
                        name={getWorkoutIcon(workout.type)}
                        size={18}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.workoutFieldText}>{workout.type}</Text>
                    </View>
                  ) : (
                    <Text style={styles.workoutFieldPlaceholder}>Select workout</Text>
                  )}
                  <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>

              <View style={styles.workoutField}>
                <Text style={styles.workoutFieldLabel}>Distance/Duration</Text>
                <TextInput
                  style={styles.workoutInput}
                  placeholder="e.g., 5km, 30 min"
                  value={workout.distance || ''}
                  onChangeText={(text) => updateWorkout(selectedDay, index, 'distance', text)}
                  placeholderTextColor={colors.placeholderColor}
                  returnKeyType="done"
                  maxLength={20}
                />
              </View>

              <TouchableOpacity
                style={styles.workoutField}
                onPress={() => openPicker(selectedDay, index, 'intensity', INTENSITY_LEVELS)}
              >
                <Text style={styles.workoutFieldLabel}>Intensity</Text>
                <View style={styles.workoutFieldValue}>
                  <View style={styles.intensityRow}>
                    <View
                      style={[
                        styles.intensityDot,
                        { backgroundColor: getIntensityColor(workout.intensity || 'Medium') },
                      ]}
                    />
                    <Text style={styles.workoutFieldText}>
                      {workout.intensity || 'Medium'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.workoutField}
                onPress={() => openPicker(selectedDay, index, 'timing', WORKOUT_TIMING_OPTIONS)}
              >
                <Text style={styles.workoutFieldLabel}>Workout Time</Text>
                <View style={styles.workoutFieldValue}>
                  <Text style={styles.workoutFieldText}>
                    {workout.timing || '—'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>

              {index > 0 && (
                <TouchableOpacity
                  style={styles.removeWorkoutBtn}
                  onPress={() => removeWorkout(selectedDay, index)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={styles.removeWorkoutText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {selectedWorkouts.length < 5 && (
            <TouchableOpacity
              style={styles.addAnotherWorkoutButton}
              onPress={() => addWorkout(selectedDay)}
              accessibilityLabel={addWorkoutLabel}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.addAnotherWorkoutText}>{addWorkoutLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Save Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={[styles.modalOverlay, styles.saveModalOverlay]} onPress={() => setShowSaveModal(false)}>
            <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Training Plan</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter plan name (e.g., Marathon Prep Week 1)"
              value={planName}
              onChangeText={setPlanName}
              placeholderTextColor="#9CA3AF"
              autoFocus
              returnKeyType="done"
              maxLength={40}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSave}
                disabled={trainingPlanHook.isSaving}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  {trainingPlanHook.isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Load Modal */}
      <Modal
        visible={showLoadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLoadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowLoadModal(false)}
            accessibilityLabel="Close load training plan modal"
            accessibilityRole="button"
          />
          <View style={styles.loadModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Load Training Plan</Text>
              <TouchableOpacity onPress={() => setShowLoadModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {trainingPlanHook.savedPlans.length === 0 ? (
              <View style={styles.emptyPlansContainer}>
                <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyPlansText}>
                  No saved training plans yet. Create and save one to see it here!
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.plansList}
                contentContainerStyle={styles.plansListContent}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {trainingPlanHook.savedPlans.map((plan) => {
                  const isLoadedPlan = plan.id === trainingPlanHook.currentPlanId;

                  return (
                  <View key={plan.id} style={styles.planItem}>
                    <View style={styles.planItemLeft}>
                      <View style={styles.planItemTitleRow}>
                        <Text style={styles.planItemName} numberOfLines={1}>
                          {plan.name}
                        </Text>
                        {isLoadedPlan && (
                          <View style={styles.activeBadgeSmall}>
                            <Text style={styles.activeBadgeTextSmall}>Active</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.planItemDate}>
                        {getPlanDateLabel(plan)}
                      </Text>
                    </View>

                    <View style={styles.planItemActions}>
                      {!isLoadedPlan && (
                        <TouchableOpacity
                          style={styles.planActionBtn}
                          onPress={() => handleLoadPlan(plan.id)}
                        >
                          <Text style={styles.planActionBtnText}>Load</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.planActionBtn, styles.planActionBtnDelete]}
                        onPress={() => handleDelete(plan.id, plan.name)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Type Picker */}
      <Picker
        visible={showTypePicker}
        options={WORKOUT_TYPES}
        selectedValue={
          pickerContext.day && pickerContext.index !== null
            ? trainingPlanHook.plan[pickerContext.day]?.workouts?.[pickerContext.index]?.type || ''
            : ''
        }
        onValueChange={handlePickerValueChange}
        onClose={() => setShowTypePicker(false)}
        title="Select Workout Type"
      />

      {/* Intensity Picker */}
      <Picker
        visible={showIntensityPicker}
        options={INTENSITY_LEVELS}
        selectedValue={
          pickerContext.day && pickerContext.index !== null
            ? trainingPlanHook.plan[pickerContext.day]?.workouts?.[pickerContext.index]
                ?.intensity || 'Medium'
            : 'Medium'
        }
        onValueChange={handlePickerValueChange}
        onClose={() => setShowIntensityPicker(false)}
        title="Select Intensity"
      />

      {/* Workout Time Picker */}
      <Picker
        visible={showTimingPicker}
        options={WORKOUT_TIMING_OPTIONS}
        selectedValue={
          pickerContext.day && pickerContext.index !== null
            ? trainingPlanHook.plan[pickerContext.day]?.workouts?.[pickerContext.index]
                ?.timing || '—'
            : '—'
        }
        onValueChange={handlePickerValueChange}
        onClose={() => setShowTimingPicker(false)}
        title="Workout Time"
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  trainingHeader: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  planControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: 4,
  },
  planInfo: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  planTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  savedConfirmationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.successLight,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.successBorder,
    gap: 3,
    flexShrink: 0,
  },
  savedConfirmationText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionButtonSecondary: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerActionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  calendarDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 0,
  },
  calendarWeekday: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  calendarWeekdaySelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  calendarDateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDateCircleSelected: {
    backgroundColor: colors.primary,
  },
  calendarDateCircleToday: {
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  calendarDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendarDateTextSelected: {
    fontWeight: '800',
    color: colors.textInverse,
  },
  calendarDateTextToday: {
    color: colors.text,
    fontWeight: '700',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.successLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.successBorder,
    flexShrink: 0,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.successText,
  },
  activeBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.successLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.successBorder,
    flexShrink: 0,
  },
  activeBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 11,
    paddingBottom: 20,
  },
  workoutsContainer: {
    gap: 12,
  },
  addAnotherWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    gap: 8,
  },
  addAnotherWorkoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  workoutCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 14,
    gap: 12,
  },
  workoutField: {
    marginBottom: 4,
  },
  workoutFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  workoutFieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  workoutTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  workoutFieldText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  workoutFieldPlaceholder: {
    fontSize: 14,
    color: colors.placeholderColor,
    flex: 1,
  },
  workoutInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text,
    minHeight: 44,
  },
  workoutInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  removeWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
    gap: 6,
  },
  removeWorkoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoidingOverlay: {
    flex: 1,
  },
  saveModalOverlay: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
  },
  loadModalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  modalInput: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalButtonTextPrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
  emptyPlansContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPlansText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 20,
    fontWeight: '600',
  },
  plansList: {
    flexShrink: 1,
  },
  plansListContent: {
    paddingBottom: 4,
  },
  planItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  planItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  planItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  planItemName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  planItemDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  planItemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  planActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  planActionBtnDelete: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: 10,
  },
  planActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
