import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useProductTour } from '../../context/ProductTourContext';

const TOOLTIP_GAP = 12;
const TOOLTIP_MAX_WIDTH = 340;
const HOLE_RADIUS = 12;

export function TourSpotlight() {
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const {
    isActive,
    currentStep,
    currentTarget,
    awaitingTarget,
    stepIndex,
    steps,
    next,
    back,
    skip,
    finish,
    pressCurrentTarget,
  } = useProductTour();

  const styles = useMemo(() => getStyles(colors), [colors]);
  const pulse = useSharedValue(1);

  const handleNext = () => {
    if (currentStep?.advanceOn === 'targetPress') {
      pressCurrentTarget();
      return;
    }
    next();
  };

  useEffect(() => {
    if (!isActive || !currentTarget) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [isActive, currentTarget, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.35 + (pulse.value - 1) * 4,
  }));

  if (!isActive || !currentStep || awaitingTarget) {
    return null;
  }

  const hole = currentTarget
    ? {
        x: Math.max(0, currentTarget.x - (currentTarget.padding || 0)),
        y: Math.max(0, currentTarget.y - (currentTarget.padding || 0)),
        width: currentTarget.width + (currentTarget.padding || 0) * 2,
        height: currentTarget.height + (currentTarget.padding || 0) * 2,
      }
    : null;

  const isLast = Boolean(currentStep.isLast) || stepIndex >= steps.length - 1;
  const stepLabel = `${stepIndex + 1} of ${steps.length}`;

  // Absolute overlay (not Modal) so allowTargetPress holes can pass touches
  // through to footer/header/in-screen targets underneath.
  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Visual dim + cutout (non-interactive) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={screenWidth} height={screenHeight}>
          <Defs>
            <Mask id="tourMask">
              <Rect x={0} y={0} width={screenWidth} height={screenHeight} fill="#fff" />
              {hole ? (
                <Rect
                  x={hole.x}
                  y={hole.y}
                  width={hole.width}
                  height={hole.height}
                  rx={HOLE_RADIUS}
                  ry={HOLE_RADIUS}
                  fill="#000"
                />
              ) : null}
            </Mask>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={screenWidth}
            height={screenHeight}
            fill="rgba(0,0,0,0.72)"
            mask="url(#tourMask)"
          />
        </Svg>
        {hole ? (
          <Animated.View
            style={[
              styles.pulseBorder,
              {
                left: hole.x,
                top: hole.y,
                width: hole.width,
                height: hole.height,
                borderColor: colors.primary,
              },
              pulseStyle,
            ]}
          />
        ) : null}
      </View>

      <TouchBlockers
        hole={hole}
        allowTargetPress={Boolean(currentStep.allowTargetPress && hole)}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />

      <TooltipCard
        step={currentStep}
        hole={hole}
        stepLabel={stepLabel}
        isLast={isLast}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        styles={styles}
        colors={colors}
        onSkip={skip}
        onBack={back}
        onNext={handleNext}
        onDone={finish}
      />
    </View>
  );
}

function TouchBlockers({ hole, allowTargetPress, screenWidth, screenHeight }) {
  if (!hole || !allowTargetPress) {
    return <View style={StyleSheet.absoluteFill} pointerEvents="auto" />;
  }

  const top = Math.max(0, hole.y);
  const left = Math.max(0, hole.x);
  const right = Math.max(0, screenWidth - (hole.x + hole.width));
  const bottom = Math.max(0, screenHeight - (hole.y + hole.height));

  return (
    <>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: top }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: bottom }} />
      <View
        style={{
          position: 'absolute',
          top: hole.y,
          left: 0,
          width: left,
          height: hole.height,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: hole.y,
          right: 0,
          width: right,
          height: hole.height,
        }}
      />
    </>
  );
}

function TooltipCard({
  step,
  hole,
  stepLabel,
  isLast,
  screenWidth,
  screenHeight,
  styles,
  colors,
  onSkip,
  onBack,
  onNext,
  onDone,
}) {
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const tooltipWidth = Math.min(TOOLTIP_MAX_WIDTH, screenWidth - 32);

  const placement = resolvePlacement({
    preferred: step.placement || 'bottom',
    force: Boolean(step.forcePlacement),
    hole,
    tooltipHeight,
    screenHeight,
  });

  const positionStyle = getTooltipPosition({
    placement,
    force: Boolean(step.forcePlacement),
    hole,
    tooltipWidth,
    tooltipHeight,
    screenWidth,
    screenHeight,
  });

  return (
    <View
      style={[styles.tooltip, positionStyle, { width: tooltipWidth }]}
      onLayout={(e) => setTooltipHeight(e.nativeEvent.layout.height)}
      pointerEvents="auto"
    >
      <Text style={styles.stepProgress}>{stepLabel}</Text>
      <Text style={styles.title}>{step.title}</Text>

      {Array.isArray(step.bodyItems) && step.bodyItems.length > 0 ? (
        <View style={styles.bodyList}>
          {step.bodyItems.map((item) => (
            <View key={item} style={styles.bodyListRow}>
              <View style={[styles.bodyBullet, { backgroundColor: colors.primary }]} />
              <Text style={styles.bodyListText}>{item}</Text>
            </View>
          ))}
          {step.body ? <Text style={[styles.body, styles.bodyAfterList]}>{step.body}</Text> : null}
        </View>
      ) : (
        <Text style={styles.body}>{step.body}</Text>
      )}

      <View style={styles.actions}>
        {step.showSkip !== false && !isLast ? (
          <TouchableOpacity onPress={onSkip} hitSlop={8} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>
              {step.id === 'dashboard_welcome' ? 'Skip tour' : 'Skip'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionsSpacer} />
        )}

        <View style={styles.actionsRight}>
          {step.showBack ? (
            <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          ) : null}

          {isLast ? (
            <TouchableOpacity onPress={onDone} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          ) : step.showNext ? (
            <TouchableOpacity onPress={onNext} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Next</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function resolvePlacement({ preferred, force, hole, tooltipHeight, screenHeight }) {
  if (preferred === 'center' || !hole) return 'center';
  if (force && (preferred === 'top' || preferred === 'bottom')) return preferred;

  const spaceAbove = hole.y;
  const spaceBelow = screenHeight - (hole.y + hole.height);
  const needed = tooltipHeight + TOOLTIP_GAP + 16;

  if (preferred === 'top') {
    if (spaceAbove >= needed || spaceAbove >= spaceBelow) return 'top';
    return 'bottom';
  }

  if (preferred === 'bottom') {
    if (spaceBelow >= needed || spaceBelow >= spaceAbove) return 'bottom';
    return 'top';
  }

  return preferred;
}

function getTooltipPosition({
  placement,
  force,
  hole,
  tooltipWidth,
  tooltipHeight,
  screenWidth,
  screenHeight,
}) {
  if (placement === 'center' || !hole) {
    return {
      top: Math.max(24, (screenHeight - Math.max(tooltipHeight, 160)) / 2),
      left: (screenWidth - tooltipWidth) / 2,
    };
  }

  const tipH = tooltipHeight || 140;
  let top;
  if (placement === 'top') {
    top = force ? 16 : hole.y - TOOLTIP_GAP - tipH;
  } else if (force) {
    // Sit at the bottom of the cutout so tall targets (training editor) keep
    // the tip below the Save row without flipping above the hole.
    top = hole.y + hole.height - tipH - TOOLTIP_GAP;
  } else {
    top = hole.y + hole.height + TOOLTIP_GAP;
  }

  let left = hole.x + hole.width / 2 - tooltipWidth / 2;
  left = Math.min(Math.max(16, left), screenWidth - tooltipWidth - 16);
  top = Math.min(Math.max(16, top), screenHeight - tipH - 16);

  return { top, left };
}

const getStyles = (colors) =>
  StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 9999,
      elevation: 9999,
    },
    pulseBorder: {
      position: 'absolute',
      borderRadius: HOLE_RADIUS,
      borderWidth: 2,
    },
    tooltip: {
      position: 'absolute',
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 8,
    },
    stepProgress: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    title: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 8,
    },
    body: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    bodyAfterList: {
      marginTop: 10,
    },
    bodyList: {
      gap: 6,
    },
    bodyListRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    bodyBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 6,
    },
    bodyListText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      gap: 8,
    },
    actionsSpacer: {
      flex: 1,
    },
    actionsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    secondaryBtn: {
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    secondaryBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      minWidth: 72,
      alignItems: 'center',
    },
    primaryBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textInverse,
    },
  });
