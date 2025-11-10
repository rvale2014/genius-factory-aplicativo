import { CheckboxIcon } from "@/components/shared/CheckboxIcon";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SheetHeaderProps = {
  title: string;
  onClose: () => void;
  onSelectAll?: () => void;
  allSelected?: boolean;
  showSelectAll?: boolean;
};

export function SheetHeader({
  title,
  onClose,
  onSelectAll,
  allSelected = false,
  showSelectAll = true,
}: SheetHeaderProps) {
  const shouldShowSelectAll = Boolean(showSelectAll && onSelectAll);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={22} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {shouldShowSelectAll ? (
        <TouchableOpacity style={styles.selectAllRow} onPress={onSelectAll}>
          <CheckboxIcon checked={allSelected} />
          <Text style={styles.selectAllLabel}>Selecionar todas</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectAllLabel: {
    color: "#FF2E88",
    fontWeight: "600",
  },
});

