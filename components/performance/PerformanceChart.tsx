// src/components/performance/PerformanceChart.tsx

import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import {
  obterPerformanceDiaria,
  PerformanceDiariaDia,
} from '../../src/services/performanceDiariaService';

interface PerformanceChartProps {
  materias: Array<{ materiaId: string; materiaNome: string }>;
}

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

// Função para agrupar dados por semana
function agregarDadosPorSemana(dados: PerformanceDiariaDia[]): PerformanceDiariaDia[] {
  const porSemana: Record<string, { acertos: number; total: number }> = {};

  dados.forEach((dia) => {
    const data = parseISO(dia.data);
    const inicioSemana = format(startOfWeek(data, { weekStartsOn: 0 }), 'yyyy-MM-dd');

    if (!porSemana[inicioSemana]) {
      porSemana[inicioSemana] = { acertos: 0, total: 0 };
    }

    porSemana[inicioSemana].acertos += dia.acertos;
    porSemana[inicioSemana].total += dia.totalQuestoes;
  });

  return Object.entries(porSemana)
    .map(([semana, stats]) => ({
      data: semana,
      taxaAcertos: stats.total > 0 ? Math.round((stats.acertos / stats.total) * 1000) / 10 : 0,
      totalQuestoes: stats.total,
      acertos: stats.acertos,
      erros: stats.total - stats.acertos,
    }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function PerformanceChart({ materias }: PerformanceChartProps) {
  const [dados, setDados] = useState<PerformanceDiariaDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros locais (independentes dos filtros principais)
  // DEFAULT: "todas" matérias e "7" dias
  const [materiaSelecionada, setMateriaSelecionada] = useState<string>('todas');
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'7' | '14' | '30' | 'all'>('7');

  // Modais
  const [materiaModalVisible, setMateriaModalVisible] = useState(false);
  const [periodoModalVisible, setPeriodoModalVisible] = useState(false);

  // Carregar dados
  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        setErro(null);

        const params: any = { dias: periodoSelecionado };
        if (materiaSelecionada !== 'todas') {
          params.materiaId = materiaSelecionada;
        }

        const resultado = await obterPerformanceDiaria(params);
        setDados(resultado.desempenhoDiario);
      } catch (e: any) {
        console.error('Erro ao carregar desempenho diário:', e);
        setErro('Não foi possível carregar os dados do gráfico.');
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [materiaSelecionada, periodoSelecionado]);

  // Processar dados: agregar por semana apenas para "all" com muitos dados
  const dadosProcessados = useMemo(() => {
    if (periodoSelecionado === 'all' && dados.length > 30) {
      return agregarDadosPorSemana(dados);
    }
    return dados;
  }, [dados, periodoSelecionado]);

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    return dadosProcessados.map((dia) => ({
      value: Math.max(0, dia.taxaAcertos), // Garante que valores não sejam negativos
      label: format(parseISO(dia.data), 'dd/MM', { locale: ptBR }),
      dataCompleta: dia.data,
      totalQuestoes: dia.totalQuestoes,
    }));
  }, [dadosProcessados]);

  // Calcular largura dinâmica do gráfico
  const chartWidth = Math.max(320, chartData.length * 40);
  const needsScroll = chartData.length > 7;

  // Opções de filtros
  const materiaOptions = [
    { materiaId: 'todas', materiaNome: 'Todas as matérias' },
    ...materias,
  ];

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
      {/* Título */}
      <Text style={styles.title}>Desempenho diário</Text>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.8}
          onPress={() => setMateriaModalVisible(true)}
        >
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {selectedMateriaLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.8}
          onPress={() => setPeriodoModalVisible(true)}
        >
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {selectedPeriodoLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FF5FDB" />
          <Text style={styles.loadingText}>Carregando gráfico...</Text>
        </View>
      ) : erro ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#b00020" />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      ) : chartData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={32} color="#9CA3AF" />
          <Text style={styles.emptyText}>Nenhum dado disponível para o período selecionado</Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartScrollContent}
          >
            <LineChart
              data={chartData}
              width={chartWidth}
              height={180}
              maxValue={110}
              noOfSections={4}
              spacing={40}
              color="#FF5FDB"
              thickness={3}
              startFillColor="rgba(255, 95, 219, 0.3)"
              endFillColor="rgba(255, 95, 219, 0.05)"
              startOpacity={0.9}
              endOpacity={0.2}
              initialSpacing={15}
              endSpacing={20}
              yAxisColor="#E5E7EB"
              xAxisColor="#E5E7EB"
              yAxisThickness={1}
              xAxisThickness={1}
              yAxisTextStyle={styles.yAxisLabel}
              xAxisLabelTextStyle={styles.xAxisLabel}
              dataPointsColor="#FF5FDB"
              dataPointsRadius={4}
              areaChart
              hideRules
              formatYLabel={(value) => {
                const numValue = parseFloat(value);
                // Não mostra valores negativos no eixo Y
                if (numValue < 0) return '';
                // Mapeia os valores calculados para os rótulos exatos desejados
                // Com maxValue=110 e noOfSections=4, temos: 0, 27.5, 55, 82.5, 110
                if (numValue <= 13.75) return '0%';
                if (numValue <= 41.25) return '25%';
                if (numValue <= 68.75) return '50%';
                if (numValue <= 96.25) return '75%';
                return '100%';
              }}
              scrollToEnd
              scrollAnimation
            />
          </ScrollView>

          {/* Indicador visual de scroll */}
          {needsScroll && (
            <View style={styles.scrollHint}>
              <Ionicons name="swap-horizontal" size={14} color="#9CA3AF" />
              <Text style={styles.scrollHintText}>Deslize para ver mais</Text>
            </View>
          )}
        </View>
      )}

      {/* Modais de filtro */}
      <FilterModal
        visible={materiaModalVisible}
        title="Escolha a matéria"
        onClose={() => setMateriaModalVisible(false)}
        options={materiaOptions.map((m) => ({ label: m.materiaNome, value: m.materiaId }))}
        selectedValue={materiaSelecionada}
        onSelect={(value) => {
          setMateriaSelecionada(value);
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
          setPeriodoSelecionado(value as typeof periodoSelecionado);
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

function FilterModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: FilterModalProps) {
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
                  <Text
                    style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}
                  >
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: getInterFont('600'),
  },
  filtersRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    width: '100%',
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
  filterButtonText: {
    fontSize: 12,
    color: '#111827',
    fontFamily: getInterFont('500'),
    flex: 1,
    marginRight: 8,
  },
  chartWrapper: {
    gap: 4,
  },
  chartScrollContent: {
    paddingRight: 20,
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  scrollHintText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: getInterFont('400'),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: getInterFont('400'),
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#b00020',
    textAlign: 'center',
    fontFamily: getInterFont('400'),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: getInterFont('400'),
    maxWidth: 240,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: getInterFont('400'),
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: getInterFont('400'),
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