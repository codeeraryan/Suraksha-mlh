import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

/**
 * WaveAnimation
 * Shows pulsating rings when isListening=true.
 * Shows pulsating bars when isSpeaking=true.
 * Shows static dot otherwise.
 */
const WaveAnimation = ({ isListening = false, isSpeaking = false, color = '#00FFAA' }) => {
  if (!isListening && !isSpeaking) {
    return <View style={[styles.dot, { backgroundColor: color }]} />;
  }

  if (isSpeaking) {
    // Vertical bar animation for speaking mode
    const barHeights = [14, 22, 30, 22, 14];
    return (
      <View style={styles.barsContainer}>
        {barHeights.map((baseH, i) => (
          <MotiView
            key={i}
            from={{ height: 6 }}
            animate={{ height: baseH + 10 }}
            transition={{
              type: 'timing',
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              delay: i * 80,
              loop: true,
              repeatReverse: true,
            }}
            style={[styles.bar, { backgroundColor: color }]}
          />
        ))}
      </View>
    );
  }

  // Ring pulse animation for listening mode
  return (
    <View style={styles.ringContainer}>
      {[0, 1, 2].map(i => (
        <MotiView
          key={i}
          from={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 2.2 }}
          transition={{
            type: 'timing',
            duration: 1800,
            easing: Easing.out(Easing.exp),
            delay: i * 500,
            loop: true,
            repeatReverse: false,
          }}
          style={[
            StyleSheet.absoluteFillObject,
            styles.ring,
            { borderColor: color },
          ]}
        />
      ))}
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 50,
  },
  bar: {
    width: 5,
    borderRadius: 4,
  },
});

export default WaveAnimation;
