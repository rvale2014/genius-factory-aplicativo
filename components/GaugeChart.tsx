// components/GaugeChart.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface GaugeChartProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  gradientStart?: string;
  gradientEnd?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  fontSize?: number;
  fontFamily?: string;
  animated?: boolean;
  durationMs?: number;
}

export function GaugeChart({
  value,
  size = 140,
  strokeWidth = 14,
  gradientStart = '#a855f7',
  gradientEnd = '#f472b6',
  backgroundColor = 'rgba(168, 85, 247, 0.12)',
  showLabel = true,
  label = 'Taxa de acertos',
  fontSize = 32,
  fontFamily = 'Inter-Bold',
  animated = true,
  durationMs = 1000,
}: GaugeChartProps) {
  const clamped = Math.max(0, Math.min(100, value));

  // Geometria
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  // Calcula ponto no círculo
  const getPoint = (angle: number) => {
    const rad = toRadians(angle);
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  // Path do semicírculo completo (180° a 0°)
  const startPoint = getPoint(180);
  const endPoint = getPoint(0);
  const arcPath = `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 0 1 ${endPoint.x} ${endPoint.y}`;

  // Comprimento do arco (meia circunferência)
  const arcLength = Math.PI * radius;

  // Animação
  const anim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);
  const [dashOffset, setDashOffset] = useState(arcLength);

  useEffect(() => {
    if (!animated) {
      // Para mostrar X% do arco: offset = arcLength * (1 - X/100)
      // 0% = offset = arcLength (nada visível)
      // 100% = offset = 0 (tudo visível)
      const offset = arcLength * (1 - clamped / 100);
      setDashOffset(offset);
      setDisplayValue(Math.round(clamped));
      anim.setValue(clamped);
      return;
    }

    anim.stopAnimation();
    anim.setValue(0);
    setDisplayValue(0);
    setDashOffset(arcLength);

    const listener = anim.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
      const offset = arcLength * (1 - v / 100);
      setDashOffset(offset);
    });

    Animated.timing(anim, {
      toValue: clamped,
      duration: durationMs,
      useNativeDriver: false,
    }).start(() => {
      anim.removeListener(listener);
      setDisplayValue(Math.round(clamped));
      setDashOffset(arcLength * (1 - clamped / 100));
    });

    return () => {
      anim.removeAllListeners();
    };
  }, [clamped, animated, durationMs, arcLength]);

  const svgWidth = size;
  const svgHeight = size / 2 + 30;

  return (
    <View style={styles.container}>
      <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradientStart} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientEnd} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Arco de fundo - sempre completo */}
        <Path
          d={arcPath}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Arco preenchido - usando strokeDasharray para controlar o preenchimento */}
        <Path
          d={arcPath}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${arcLength * 2}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>

      <Text style={[styles.percentText, { fontSize, fontFamily }]}>{displayValue}%</Text>
      {showLabel && <Text style={styles.labelText}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: -18,
    marginBottom: 4,
    textAlign: 'center',
  },
  labelText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
