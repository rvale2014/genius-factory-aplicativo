// components/notificacoes/NotificacaoDetalheSheet.tsx
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Bell, Clock, ExternalLink, Megaphone, Trophy } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Notificacao } from '../../src/schemas/notificacoes';
import { tempoRelativo } from '../../src/lib/dateFormat';

type Props = {
  notificacao: Notificacao | null;
  onClose: () => void;
  onNavegar: () => void;
};

/** Retorna ícone e cor por tipo de notificação */
function getIconePorTipo(tipo: Notificacao['tipo']) {
  switch (tipo) {
    case 'manual':
      return { Icon: Megaphone, color: '#8B5CF6', label: 'Aviso' };
    case 'inatividade':
      return { Icon: Clock, color: '#F59E0B', label: 'Lembrete' };
    case 'conquista':
      return { Icon: Trophy, color: '#14b8a6', label: 'Conquista' };
    default:
      return { Icon: Bell, color: '#666', label: 'Notificação' };
  }
}

export default function NotificacaoDetalheSheet({ notificacao, onClose, onNavegar }: Props) {
  const ref = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['50%', '80%'], []);

  const open = notificacao !== null;

  useEffect(() => {
    if (!ref.current) return;
    if (open) ref.current.snapToIndex(0);
    else ref.current.close();
  }, [open]);

  if (!notificacao) return null;

  const { Icon, color, label } = getIconePorTipo(notificacao.tipo);
  const temRota = notificacao.dados?.route && typeof notificacao.dados.route === 'string';

  return (
    <BottomSheet
      ref={ref}
      index={open ? 0 : -1}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backdropComponent={(p) => (
        <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...p} />
      )}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Tipo + Tempo */}
        <View style={styles.metaRow}>
          <View style={[styles.tipoBadge, { backgroundColor: `${color}15` }]}>
            <Icon size={14} color={color} strokeWidth={2} />
            <Text style={[styles.tipoLabel, { color }]}>{label}</Text>
          </View>
          <Text style={styles.tempo}>{tempoRelativo(notificacao.criadaEm)}</Text>
        </View>

        {/* Título */}
        <Text style={styles.titulo}>{notificacao.titulo}</Text>

        {/* Corpo completo */}
        <Text style={styles.corpo}>{notificacao.corpo}</Text>

        {/* Botão de navegação */}
        {temRota && (
          <TouchableOpacity style={styles.navegarButton} onPress={onNavegar} activeOpacity={0.7}>
            <ExternalLink size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.navegarButtonText}>Ir para Dashboard</Text>
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: '#DDD',
    width: 36,
  },
  sheetBackground: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tipoLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  tempo: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Inter',
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 12,
  },
  corpo: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  navegarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF5FDB',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  navegarButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
