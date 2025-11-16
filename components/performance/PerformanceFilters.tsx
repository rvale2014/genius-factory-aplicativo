// src/components/performance/PerformanceFilters.tsx

import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PerformanceFiltersProps {
  materias: Array<{ materiaId: string; materiaNome: string }>;
  materiaSelecionada: string;
  onMateriaChange: (materiaId: string) => void;
  periodoSelecionado: '7' | '14' | '30' | 'all';
  onPeriodoChange: (periodo: '7' | '14' | '30' | 'all') => void;
}

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export function PerformanceFilters({
  materias,
  materiaSelecionada,
  onMateriaChange,
  periodoSelecionado,
  onPeriodoChange,
}: PerformanceFiltersProps) {
  const [materiaModalVisible, setMateriaModalVisible] = useState(false);
  const [periodoModalVisible, setPeriodoModalVisible] = useState(false);

  const materiaOptions = useMemo(
    () => [{ materiaId: 'todas', materiaNome: 'Todas as matérias' }, ...materias],
    [materias],
  );

  const periodOptions: Array<{ label: string; value: '7' | '14' | '30' | 'all' }> = [
    { label: 'Últimos 7 dias', value: '7' },
    { label: 'Últimos 14 dias', value: '14' },
    { label: 'Últimos 30 dias', value: '30' },
    { label: 'Desde o início', value: 'all' },
  ];

  const selectedMateriaLabel =
    materiaOptions.find((m) => m.materiaId === materiaSelecionada)?.materiaNome ?? 'Selecionar';

  const selectedPeriodoLabel =
    periodOptions.find((p) => p.value === periodoSelecionado)?.label ?? 'Selecionar';

  return (
    <View style={styles.container}>
      {/* Filtro de Matéria */}
      <View style={styles.filterGroup}>
        <TouchableOpacity
          style={styles.selectButton}
          activeOpacity={0.8}
          onPress={() => setMateriaModalVisible(true)}
        >
          <Text style={styles.selectButtonText} numberOfLines={1}>
            {selectedMateriaLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Filtro de Período */}
      <View style={styles.filterGroup}>
        <TouchableOpacity
          style={styles.selectButton}
          activeOpacity={0.8}
          onPress={() => setPeriodoModalVisible(true)}
        >
          <Text style={styles.selectButtonText} numberOfLines={1}>
            {selectedPeriodoLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={materiaModalVisible}
        title="Escolha a matéria"
        onClose={() => setMateriaModalVisible(false)}
        options={materiaOptions.map((m) => ({ label: m.materiaNome, value: m.materiaId }))}
        selectedValue={materiaSelecionada}
        onSelect={(value) => {
          onMateriaChange(value);
          setMateriaModalVisible(false);
        }}
      />

      <FilterModal
        visible={periodoModalVisible}
        title="Escolha o período"
        onClose={() => setPeriodoModalVisible(false)}
        options={periodOptions}
        selectedValue={periodoSelecionado}
        onSelect={(value) => {
          onPeriodoChange(value as typeof periodoSelecionado);
          setPeriodoModalVisible(false);
        }}
      />
    </View>
  );
}

type FilterOption = { label: string; value: string };

type FilterModalProps = {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

function FilterModal({ visible, title, options, selectedValue, onSelect, onClose }: FilterModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const isSelected = option.value === selectedValue;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                  activeOpacity={0.8}
                  onPress={() => onSelect(option.value)}
                >
                  <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                    {option.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={16} color="#7C3AED" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    gap: 6,
  },
  filterGroup: {
    gap: 0,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 10,
    height: 34,
  },
  selectButtonText: {
    fontSize: 12,
    color: '#111827',
    fontFamily: getInterFont('500'),
    flex: 1,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: getInterFont('700'),
  },
  modalScroll: {
    maxHeight: 320,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalOptionSelected: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  modalOptionText: {
    fontSize: 12,
    color: '#111827',
    fontFamily: getInterFont('500'),
    flex: 1,
    marginRight: 8,
  },
  modalOptionTextSelected: {
    color: '#7C3AED',
    fontFamily: getInterFont('600'),
  },
});