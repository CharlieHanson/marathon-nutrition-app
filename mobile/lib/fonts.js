import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import {
  Quicksand_300Light,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';

export const quicksandFonts = {
  Quicksand_300Light,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
};

const WEIGHT_TO_FAMILY = {
  '100': 'Quicksand_300Light',
  '200': 'Quicksand_300Light',
  '300': 'Quicksand_300Light',
  '400': 'Quicksand_400Regular',
  normal: 'Quicksand_400Regular',
  '500': 'Quicksand_500Medium',
  '600': 'Quicksand_600SemiBold',
  '700': 'Quicksand_700Bold',
  bold: 'Quicksand_700Bold',
  '800': 'Quicksand_700Bold',
  '900': 'Quicksand_700Bold',
};

function shouldPreserveFontFamily(fontFamily) {
  if (!fontFamily || typeof fontFamily !== 'string') return false;
  if (fontFamily.startsWith('Quicksand')) return false;
  // Keep icon fonts, monospace, and any other explicit custom faces
  return true;
}

export function resolveQuicksandFamily(style) {
  const flat = StyleSheet.flatten(style) || {};
  if (shouldPreserveFontFamily(flat.fontFamily)) {
    return flat.fontFamily;
  }
  return WEIGHT_TO_FAMILY[flat.fontWeight ?? '400'] || WEIGHT_TO_FAMILY['400'];
}

function patchComponent(Component) {
  if (Component.__quicksandPatched) return;

  const originalRender = Component.render;
  if (typeof originalRender !== 'function') return;

  Component.render = function render(props, ref) {
    const origin = originalRender.call(this, props, ref);
    const fontFamily = resolveQuicksandFamily(origin.props.style);
    const preserve = shouldPreserveFontFamily(
      (StyleSheet.flatten(origin.props.style) || {}).fontFamily
    );
    return React.cloneElement(origin, {
      style: [
        { fontFamily },
        origin.props.style,
        // Weight is encoded in the Quicksand face name; reset so Android
        // doesn't try to synthesize a missing weight.
        preserve ? null : { fontWeight: 'normal' },
      ],
    });
  };

  Component.__quicksandPatched = true;
}

/** Apply Quicksand to all Text / TextInput, mapping fontWeight to the right face. */
export function applyQuicksandFont() {
  patchComponent(Text);
  patchComponent(TextInput);
}
