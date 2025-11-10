import BottomSheetFooter, { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SheetFooterProps = BottomSheetFooterProps & {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
};

export function SheetFooter({
  onCancel,
  onConfirm,
  cancelText = "Cancelar",
  confirmText = "Adicionar",
  ...footerProps
}: SheetFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetFooter {...footerProps} bottomInset={0}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onCancel}>
          <Text style={[styles.text, styles.cancelText]}>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.confirm]} onPress={onConfirm}>
          <Text style={[styles.text, styles.confirmText]}>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetFooter>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: "#EEF2F7",
    backgroundColor: "#FFFFFF",
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {
    backgroundColor: "#F3F4F6",
  },
  confirm: {
    backgroundColor: "#10B981",
  },
  text: {
    fontWeight: "700",
  },
  cancelText: {
    color: "#4B5563",
    fontWeight: "600",
  },
  confirmText: {
    color: "#FFFFFF",
  },
});

