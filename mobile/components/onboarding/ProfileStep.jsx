import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseHeightCm } from '../../../shared/lib/tdeeCalc.js';
import { useTheme } from '../../context/ThemeContext';

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'gain', label: 'Gain weight' },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { value: 'low', label: 'Low (desk job, minimal activity)' },
  { value: 'moderate', label: 'Moderate (some walking, active lifestyle)' },
  { value: 'high', label: 'High (active job, lots of movement)' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other / Prefer not to say' },
];

const WEIGHT_UNITS = [
  { value: 'lbs', label: 'lbs' },
  { value: 'kg', label: 'kg' },
];

const HEIGHT_UNITS = [
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft / in' },
];

const AGE_OPTIONS = Array.from({ length: 150 - 13 + 1 }, (_, i) => {
  const age = String(13 + i);
  return { value: age, label: age };
});

function parseWeightForDisplay(raw) {
  if (!raw || typeof raw !== 'string') return { value: '', unit: 'lbs' };
  const s = raw.trim().toLowerCase();
  const kgMatch = s.match(/^(\d+\.?\d*)\s*(kg|kgs|kilos?)$/);
  if (kgMatch) return { value: kgMatch[1], unit: 'kg' };
  const lbMatch = s.match(/^(\d+\.?\d*)\s*(lbs?|pounds?)$/);
  if (lbMatch) return { value: lbMatch[1], unit: 'lbs' };
  const numMatch = s.match(/^(\d+\.?\d*)/);
  if (numMatch) return { value: numMatch[1], unit: 'lbs' };
  return { value: '', unit: 'lbs' };
}

function parseHeightForDisplay(raw) {
  const emptyFt = { unit: 'ft', feet: '', inches: '', meters: '' };

  if (!raw || typeof raw !== 'string') return emptyFt;
  const s = raw.trim().toLowerCase();

  const hasMetricMarker = /\s*(m|meters?|cm)\s*$/i.test(s);
  const cm = parseHeightCm(raw);

  if (cm == null && hasMetricMarker) {
    return { unit: 'm', meters: '', feet: '', inches: '' };
  }
  if (cm == null) return emptyFt;

  const isMetric = /^\d+\.?\d*\s*(m|meters?|cm)\s*$/i.test(s);
  const isImperial =
    /\d+\.?\d*\s*(?:'|'|'|′|ft|feet|foot)|(\d+\.?\d*)\s*(in|inches)|['"″']/i.test(s);
  const plainNum = parseFloat(s);
  const looksLikeMetric = !isNaN(plainNum) && plainNum > 100;

  let unit = 'ft';
  if (isMetric || (looksLikeMetric && !isImperial)) unit = 'm';
  else if (isImperial) unit = 'ft';

  if (unit === 'm') {
    const mMatch = s.match(/^(\d+\.?\d*)\s*(m|meters?)$/);
    const meters = mMatch ? mMatch[1] : String((cm / 100).toFixed(2));
    return { unit: 'm', meters, feet: '', inches: '' };
  }

  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches % 12) * 10) / 10;
  return { unit: 'ft', feet: String(feet), inches: String(inches), meters: '' };
}

export function ProfileStep({ profile, onUpdate, onNext, onBack, isSaving }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const scrollRef = useRef(null);
  const scrollY = useRef(0);
  const keyboardHeight = useRef(0);
  const focusedInputRef = useRef(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showAgePicker, setShowAgePicker] = useState(false);
  const [showWeightUnitPicker, setShowWeightUnitPicker] = useState(false);
  const [showHeightUnitPicker, setShowHeightUnitPicker] = useState(false);
  const [keyboardPad, setKeyboardPad] = useState(0);

  const scrollTargetAboveKeyboard = (target) => {
    if (!target?.measureInWindow || !scrollRef.current) return;
    target.measureInWindow((_x, y, _width, height) => {
      const windowHeight = Dimensions.get('window').height;
      const kb = keyboardHeight.current;
      const keyboardTop = kb > 0 ? windowHeight - kb : windowHeight * 0.55;
      const inputBottom = y + height;
      const gap = 24;
      if (inputBottom > keyboardTop - gap) {
        const delta = inputBottom - (keyboardTop - gap);
        scrollRef.current?.scrollTo({
          y: Math.max(0, scrollY.current + delta),
          animated: true,
        });
      }
    });
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates?.height ?? 0;
      keyboardHeight.current = height;
      setKeyboardPad(Math.max(0, height - 80));
      if (focusedInputRef.current) {
        requestAnimationFrame(() => scrollTargetAboveKeyboard(focusedInputRef.current));
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeight.current = 0;
      focusedInputRef.current = null;
      setKeyboardPad(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollFocusedInputAboveKeyboard = (event) => {
    const target = event?.target;
    focusedInputRef.current = target;
    const delay = Platform.OS === 'ios' ? 60 : 120;
    setTimeout(() => scrollTargetAboveKeyboard(target), delay);
  };

  const initialHeight = parseHeightForDisplay(profile.height);
  const initialWeight = parseWeightForDisplay(profile.weight);

  const [heightUnit, setHeightUnit] = useState(initialHeight.unit);
  const [heightMeters, setHeightMeters] = useState(initialHeight.meters || '');
  const [heightFeet, setHeightFeet] = useState(initialHeight.feet || '');
  const [heightInches, setHeightInches] = useState(initialHeight.inches || '');
  const [weightValue, setWeightValue] = useState(initialWeight.value);
  const [weightUnit, setWeightUnit] = useState(initialWeight.unit);

  const buildHeightString = () => {
    if (heightUnit === 'm') {
      return heightMeters ? `${heightMeters} m` : '';
    }
    return heightFeet || heightInches
      ? `${heightFeet || '0'} ft ${heightInches || '0'} in`
      : '';
  };

  const buildWeightString = () => (weightValue ? `${weightValue} ${weightUnit}` : '');

  const syncHeightToProfile = () => {
    onUpdate('height', buildHeightString());
  };

  const syncWeightToProfile = () => {
    onUpdate('weight', buildWeightString());
  };

  const isValidAge =
    profile.age &&
    AGE_OPTIONS.some((o) => o.value === String(profile.age).trim());

  const isValid =
    profile.name &&
    isValidAge &&
    buildHeightString() &&
    buildWeightString() &&
    profile.goal &&
    profile.gender &&
    profile.activityLevel;

  const handleContinue = () => {
    const heightStr = buildHeightString();
    const weightStr = buildWeightString();
    onUpdate('height', heightStr);
    onUpdate('weight', weightStr);
    onNext({ ...profile, height: heightStr, weight: weightStr });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>This helps us personalize your nutrition plan</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 + keyboardPad }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(v) => onUpdate('name', v)}
            placeholder="Your name"
            placeholderTextColor={colors.placeholderColor}
            returnKeyType="done"
            onFocus={scrollFocusedInputAboveKeyboard}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowAgePicker(true)}>
            <Text
              style={[styles.pickerText, !isValidAge && styles.pickerPlaceholder]}
              numberOfLines={1}
            >
              {isValidAge ? String(profile.age) : 'Select age'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.placeholderColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowGenderPicker(true)}>
            <Text
              style={[styles.pickerText, !profile.gender && styles.pickerPlaceholder]}
              numberOfLines={1}
            >
              {profile.gender
                ? GENDER_OPTIONS.find((o) => o.value === profile.gender)?.label ?? profile.gender
                : 'Select gender'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.placeholderColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Height</Text>
          {heightUnit === 'm' ? (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputFlex}
                placeholder="e.g., 1.73"
                placeholderTextColor={colors.placeholderColor}
                value={heightMeters}
                onChangeText={setHeightMeters}
                onBlur={syncHeightToProfile}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onFocus={scrollFocusedInputAboveKeyboard}
              />
              <TouchableOpacity
                style={styles.unitButton}
                onPress={() => setShowHeightUnitPicker(true)}
              >
                <Text style={styles.unitButtonText}>m</Text>
                <Ionicons name="chevron-down" size={16} color={colors.placeholderColor} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputSmall}
                placeholder="0"
                placeholderTextColor={colors.placeholderColor}
                value={heightFeet}
                onChangeText={(text) => setHeightFeet(text.replace(/\D/g, '').slice(0, 2))}
                onBlur={syncHeightToProfile}
                keyboardType="number-pad"
                returnKeyType="done"
                onFocus={scrollFocusedInputAboveKeyboard}
              />
              <Text style={styles.unitLabel}>ft</Text>
              <TextInput
                style={styles.inputSmall}
                placeholder="0"
                placeholderTextColor={colors.placeholderColor}
                value={heightInches}
                onChangeText={(text) => setHeightInches(text.replace(/[^\d.]/g, '').slice(0, 5))}
                onBlur={syncHeightToProfile}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onFocus={scrollFocusedInputAboveKeyboard}
              />
              <Text style={styles.unitLabel}>in</Text>
              <TouchableOpacity
                style={styles.unitButton}
                onPress={() => setShowHeightUnitPicker(true)}
              >
                <Text style={styles.unitButtonText}>ft / in</Text>
                <Ionicons name="chevron-down" size={16} color={colors.placeholderColor} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weight</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex}
              placeholder="e.g., 150 or 68"
              placeholderTextColor={colors.placeholderColor}
              value={weightValue}
              onChangeText={setWeightValue}
              onBlur={syncWeightToProfile}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onFocus={scrollFocusedInputAboveKeyboard}
            />
            <TouchableOpacity
              style={styles.unitButton}
              onPress={() => setShowWeightUnitPicker(true)}
            >
              <Text style={styles.unitButtonText}>{weightUnit}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.placeholderColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weight Goal</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowGoalPicker(true)}
          >
            <Text
              style={[styles.pickerText, !profile.goal && styles.pickerPlaceholder]}
              numberOfLines={1}
            >
              {profile.goal
                ? GOAL_OPTIONS.find((o) => o.value === profile.goal)?.label ?? profile.goal
                : 'Select goal'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.placeholderColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Activity Level (outside training)</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowActivityPicker(true)}
          >
            <Text
              style={[
                styles.pickerText,
                !profile.activityLevel && styles.pickerPlaceholder,
              ]}
              numberOfLines={1}
            >
              {profile.activityLevel
                ? ACTIVITY_LEVEL_OPTIONS.find((o) => o.value === profile.activityLevel)
                    ?.label ?? profile.activityLevel
                : 'Select level'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.placeholderColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Training Objective (optional)</Text>
          <TextInput
            style={styles.textArea}
            value={profile.objective}
            onChangeText={(v) => onUpdate('objective', v)}
            placeholder="e.g., Training for first marathon, improve 5K time..."
            placeholderTextColor={colors.placeholderColor}
            multiline
            numberOfLines={3}
            returnKeyType="done"
            blurOnSubmit
            onFocus={scrollFocusedInputAboveKeyboard}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dietary Restrictions (optional)</Text>
          <TextInput
            style={styles.textArea}
            value={profile.dietaryRestrictions}
            onChangeText={(v) => onUpdate('dietaryRestrictions', v)}
            placeholder="e.g., vegetarian, gluten-free, nut allergies..."
            placeholderTextColor={colors.placeholderColor}
            multiline
            numberOfLines={3}
            returnKeyType="done"
            blurOnSubmit
            onFocus={scrollFocusedInputAboveKeyboard}
          />
        </View>
      </ScrollView>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={isSaving}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, (!isValid || isSaving) && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAgePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAgePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAgePicker(false)}>
          <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Age</Text>
              <TouchableOpacity onPress={() => setShowAgePicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {AGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.pickerOption,
                    String(profile.age) === opt.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    onUpdate('age', opt.value);
                    setShowAgePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      String(profile.age) === opt.value && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {String(profile.age) === opt.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showGoalPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGoalPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Weight Goal</Text>
              <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {GOAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pickerOption, profile.goal === opt.value && styles.pickerOptionSelected]}
                  onPress={() => {
                    onUpdate('goal', opt.value);
                    setShowGoalPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      profile.goal === opt.value && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {profile.goal === opt.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showActivityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActivityPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowActivityPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Activity Level</Text>
              <TouchableOpacity onPress={() => setShowActivityPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {ACTIVITY_LEVEL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.pickerOption,
                    profile.activityLevel === opt.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    onUpdate('activityLevel', opt.value);
                    setShowActivityPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      profile.activityLevel === opt.value && styles.pickerOptionTextSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {opt.label}
                  </Text>
                  {profile.activityLevel === opt.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGenderPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pickerOption, profile.gender === opt.value && styles.pickerOptionSelected]}
                  onPress={() => {
                    onUpdate('gender', opt.value);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      profile.gender === opt.value && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {profile.gender === opt.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showWeightUnitPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWeightUnitPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowWeightUnitPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Weight Unit</Text>
              <TouchableOpacity onPress={() => setShowWeightUnitPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {WEIGHT_UNITS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pickerOption, weightUnit === opt.value && styles.pickerOptionSelected]}
                  onPress={() => {
                    setWeightUnit(opt.value);
                    onUpdate('weight', weightValue ? `${weightValue} ${opt.value}` : '');
                    setShowWeightUnitPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      weightUnit === opt.value && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {weightUnit === opt.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showHeightUnitPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHeightUnitPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowHeightUnitPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Height Unit</Text>
              <TouchableOpacity onPress={() => setShowHeightUnitPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {HEIGHT_UNITS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pickerOption, heightUnit === opt.value && styles.pickerOptionSelected]}
                  onPress={() => {
                    setHeightUnit(opt.value);
                    if (opt.value === 'm') {
                      const feet = parseFloat(heightFeet) || 0;
                      const inches = parseFloat(heightInches) || 0;
                      const totalInches = feet * 12 + inches;
                      const cm = totalInches * 2.54;
                      const meters = (cm / 100).toFixed(2);
                      setHeightMeters(meters);
                      onUpdate('height', `${meters} m`);
                    } else {
                      const meters = parseFloat(heightMeters);
                      if (!isNaN(meters)) {
                        const cm = meters * 100;
                        const totalInches = cm / 2.54;
                        const feet = Math.floor(totalInches / 12);
                        const inches = Math.round((totalInches % 12) * 10) / 10;
                        setHeightFeet(String(feet));
                        setHeightInches(String(inches));
                        onUpdate('height', `${feet} ft ${inches} in`);
                      } else {
                        setHeightFeet('');
                        setHeightInches('');
                        onUpdate('height', '');
                      }
                    }
                    setShowHeightUnitPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      heightUnit === opt.value && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {heightUnit === opt.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      marginHorizontal: 16,
      padding: 20,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      maxHeight: '85%',
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray700,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.inputBackground,
      minHeight: 44,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    inputFlex: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.inputBackground,
      minHeight: 44,
    },
    inputSmall: {
      width: 56,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.inputBackground,
      minHeight: 44,
      textAlign: 'center',
    },
    unitLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    unitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 44,
      backgroundColor: colors.inputBackground,
    },
    unitButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.inputBackground,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 44,
      backgroundColor: colors.inputBackground,
    },
    pickerText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    pickerPlaceholder: {
      color: colors.placeholderColor,
    },
    buttons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    backButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    primaryButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'flex-end',
    },
    pickerModal: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '70%',
    },
    pickerModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    pickerOptions: {
      maxHeight: 400,
      padding: 8,
    },
    pickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      borderRadius: 10,
    },
    pickerOptionSelected: {
      backgroundColor: colors.primaryLight,
    },
    pickerOptionText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    pickerOptionTextSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
  });
}
