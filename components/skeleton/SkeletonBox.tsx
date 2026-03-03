import React, { useCallback, useState } from 'react';
import { View, ViewStyle, LayoutChangeEvent, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface SkeletonBoxProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width, height, borderRadius = 4, style }: SkeletonBoxProps) {
  const [measuredWidth, setMeasuredWidth] = useState(200);
  const translateX = useSharedValue(-measuredWidth);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      if (w > 0) {
        setMeasuredWidth(w);
        translateX.value = -w;
        translateX.value = withRepeat(
          withTiming(w, { duration: 1200, easing: Easing.linear }),
          -1,
          false
        );
      }
    },
    [translateX]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Iniciar animação com valor default
  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(measuredWidth, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E5E5',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <AnimatedLinearGradient
        colors={['transparent', '#F0F0F0', 'transparent']}
        locations={[0.3, 0.5, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: measuredWidth,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
