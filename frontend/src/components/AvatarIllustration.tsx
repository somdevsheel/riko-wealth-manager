import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

interface Props {
  size?: number;
  speaking?: boolean;
}

const SKIN = '#E7B48C';
const HAIR = '#3A2B22';
const BLUSH = '#F2A488';

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

// Friendly illustrated advisor, hand-drawn in SVG so it stays crisp at every size
// this is used at (28px chat avatars up to 150px on the Avatar Home hero). Talks
// (mouth opens/closes on a loop) while `speaking` is true, blinks continuously at
// rest, and has a slow idle breathing motion — no external image/animation assets.
//
// Animation values drive plain React state via listeners rather than binding
// Animated.Value directly to react-native-svg props: `Animated.createAnimatedComponent`
// on an SVG primitive adds a `collapsable={false}` prop that react-native-web doesn't
// recognize as a valid DOM attribute, spamming the console with "non-boolean attribute"
// warnings. The Animated timing/easing/looping is unchanged — only the render "sink"
// moved from an Animated-wrapped prop to plain numbers.
export function AvatarIllustration({ size = 160, speaking = false }: Props) {
  const breathe = useRef(new Animated.Value(0)).current;
  const blinkRy = useRef(new Animated.Value(7)).current;
  const mouthOpen = useRef(new Animated.Value(0)).current;

  const [scale, setScale] = useState(1);
  const [blinkRyValue, setBlinkRyValue] = useState(7);
  const [mouthOpenValue, setMouthOpenValue] = useState(0);

  useEffect(() => {
    const id = breathe.addListener(({ value }) => setScale(lerp(1, 1.03, value)));
    return () => breathe.removeListener(id);
  }, [breathe]);

  useEffect(() => {
    const id = blinkRy.addListener(({ value }) => setBlinkRyValue(value));
    return () => blinkRy.removeListener(id);
  }, [blinkRy]);

  useEffect(() => {
    const id = mouthOpen.addListener(({ value }) => setMouthOpenValue(value));
    return () => mouthOpen.removeListener(id);
  }, [mouthOpen]);

  // Idle breathing.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: speaking ? 600 : 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: speaking ? 600 : 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, speaking]);

  // Blinking, on a randomized interval so it doesn't look mechanical.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleBlink = () => {
      const delay = 2200 + Math.random() * 2600;
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        Animated.sequence([
          Animated.timing(blinkRy, { toValue: 0.6, duration: 90, useNativeDriver: false }),
          Animated.timing(blinkRy, { toValue: 7, duration: 110, useNativeDriver: false }),
        ]).start(() => !cancelled && scheduleBlink());
      }, delay);
    };
    scheduleBlink();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [blinkRy]);

  // Talking: the mouth chatters open/closed while `speaking` is true.
  useEffect(() => {
    if (!speaking) {
      Animated.timing(mouthOpen, { toValue: 0, duration: 150, useNativeDriver: false }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(mouthOpen, {
          toValue: 1,
          duration: 110 + Math.random() * 70,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(mouthOpen, {
          toValue: 0.15 + Math.random() * 0.2,
          duration: 110 + Math.random() * 70,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [mouthOpen, speaking]);

  const pupilRy = blinkRyValue * 0.46;
  const mouthRy = lerp(0.8, 8, mouthOpenValue);
  const mouthRx = lerp(7, 8.5, mouthOpenValue);
  const smileOpacity = mouthOpenValue < 0.05 ? 1 : 0;
  const talkMouthOpacity = mouthOpenValue < 0.05 ? 0 : 1;

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size, transform: [{ scale }] }]}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Circle cx="80" cy="80" r="78" fill={colors.lightGreenTint} />

        {/* shoulders / shirt */}
        <Path d="M42 158 Q42 116 80 112 Q118 116 118 158 Z" fill={colors.primaryGreen} />
        {/* collar accent */}
        <Path d="M70 114 L80 128 L90 114 Z" fill={colors.accentOrange} />

        {/* neck */}
        <Rect x="70" y="96" width="20" height="24" rx="8" fill={SKIN} />

        {/* ears */}
        <Circle cx="44" cy="74" r="7" fill={SKIN} />
        <Circle cx="116" cy="74" r="7" fill={SKIN} />

        {/* head */}
        <Circle cx="80" cy="70" r="36" fill={SKIN} />

        {/* cheeks */}
        <Ellipse cx="58" cy="82" rx="7" ry="4.5" fill={BLUSH} opacity={0.35} />
        <Ellipse cx="102" cy="82" rx="7" ry="4.5" fill={BLUSH} opacity={0.35} />

        {/* hair */}
        <Path
          d="M42 68 Q40 28 80 26 Q120 28 118 68 Q118 50 102 46 Q100 58 88 52 Q86 44 80 44 Q74 44 72 52 Q60 58 58 46 Q42 50 42 68 Z"
          fill={HAIR}
        />

        {/* eyebrows */}
        <Path d="M58 56 Q65 51 72 55" stroke={HAIR} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        <Path d="M88 55 Q95 51 102 56" stroke={HAIR} strokeWidth={2.4} strokeLinecap="round" fill="none" />

        {/* eyes (sclera + pupil, animated for blinking) */}
        <Ellipse cx="66" cy="68" rx="7" ry={blinkRyValue} fill={colors.white} />
        <Ellipse cx="66" cy="68" rx="3.2" ry={pupilRy} fill={HAIR} />
        <Ellipse cx="94" cy="68" rx="7" ry={blinkRyValue} fill={colors.white} />
        <Ellipse cx="94" cy="68" rx="3.2" ry={pupilRy} fill={HAIR} />

        {/* mouth: calm smile at rest, chattering open mouth while speaking */}
        <Path
          d="M67 90 Q80 99 93 90"
          stroke={HAIR}
          strokeWidth={2.6}
          strokeLinecap="round"
          fill="none"
          opacity={smileOpacity}
        />
        <Ellipse cx="80" cy="92" rx={mouthRx} ry={mouthRy} fill={HAIR} opacity={talkMouthOpacity} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
