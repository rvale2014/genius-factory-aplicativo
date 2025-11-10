import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

type CheckboxIconProps = {
  checked?: boolean;
  indeterminate?: boolean;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  style?: ViewStyle;
};

const DEFAULT_SIZE = 22;

export function CheckboxIcon({
  checked,
  indeterminate,
  size = DEFAULT_SIZE,
  activeColor = "#F78DBD",
  inactiveColor = "#C5D0E0",
  style,
}: CheckboxIconProps) {
  const isActive = Boolean(checked || indeterminate);
  const dimension = {
    width: size,
    height: size,
    borderRadius: size * 0.32,
  };
  const iconSize = Math.round(size * 0.6);

  return (
    <View
      style={[
        styles.base,
        dimension,
        { borderColor: isActive ? activeColor : inactiveColor },
        isActive && { backgroundColor: activeColor },
        style,
      ]}
    >
      {checked ? <Ionicons name="checkmark" size={iconSize} color="#FFFFFF" /> : null}
      {indeterminate ? (
        <View
          style={[
            styles.indeterminateBar,
            { width: size * 0.55 },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  indeterminateBar: {
    height: 3,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
});

