// app/(app)/questoes
// Tela completa com abas "Simulados" e "Playground", filtros com Bottom Sheet multi-select
// e listagem paginada (5/pg) consumindo as rotas mobile/v1 já criadas.

import { AlunoHeaderSummary } from "@/components/AlunoHeaderSummary";
import QuestaoCard, { QuestaoCardData } from "@/components/questoes/QuestaoCard";
import { CheckboxIcon } from "@/components/shared/CheckboxIcon";
import GenerateSimuladoSheet from "@/components/sheets/GenerateSimuladoSheet";
import { SheetFooter } from "@/components/sheets/SheetFooter";
import { SheetHeader } from "@/components/sheets/SheetHeader";
import {
  buscarAnos,
  buscarAssuntosTree,
  buscarClasses,
  buscarFases,
  buscarGraus,
  buscarInstituicoes,
  buscarMaterias,
  buscarSeries,
  contarQuestoes,
  listarQuestoes,
  QuestaoOption,
  QuestoesFiltros,
  type AssuntoNode,
} from "@/src/services/questoesService";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  BookOpen,
  Building,
  CalendarDays,
  Gauge,
  GraduationCap,
  Layers,
  ListChecks,
  ListTree,
  Target,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ListRenderItem } from "react-native";
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// ========= Constantes =========
const TIPOS_QUESTAO = [
  { id: "multipla_escolha", nome: "Múltipla escolha" },
  { id: "certa_errada", nome: "Certa/Errada" },
  { id: "objetiva_curta", nome: "Objetiva curta" },
  { id: "dissertativa", nome: "Dissertativa" },
  { id: "bloco_rapido", nome: "Bloco rápido" },
  { id: "ligar_colunas", nome: "Ligar colunas" },
  { id: "completar", nome: "Completar" },
  { id: "completar_topo", nome: "Completar (topo)" },
  { id: "tabela", nome: "Tabela" },
  { id: "selecao_multipla", nome: "Seleção múltipla" },
  { id: "colorir_figura", nome: "Colorir figura" },
];

const SHEET_FOOTER_HEIGHT = 88;

type QuestaoListItem = QuestaoCardData;

function summarizeLabels(labels: string[]): string | undefined {
  const clean = labels.filter((l) => !!l.trim());
  if (clean.length === 0) return undefined;
  const max = 2;
  if (clean.length <= max) return clean.join(", ");
  const head = clean.slice(0, max).join(", ");
  return `${head}, +${clean.length - max}`;
}

// ========= Componentes de UI =========
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

const FilterRow = ({
  icon: Icon,
  label,
  onPress,
  isLast,
  summary,
  hasSelection,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
  summary?: string;
  hasSelection?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.filterRow, isLast && styles.filterRowLast]}
    activeOpacity={0.75}
    onPress={onPress}
  >
    <View style={styles.filterRowLeft}>
      <Icon size={18} color="#9CA3AF" strokeWidth={2} />
      <Text style={styles.filterRowLabel}>{label}</Text>
    </View>
    <View style={styles.filterRowRight}>
      {summary ? (
        <Text style={styles.filterRowSummary} numberOfLines={2}>
          {summary}
        </Text>
      ) : null}
      <Ionicons
        name={hasSelection ? "pencil-outline" : "add"}
        size={18}
        color="#FF2E88"
      />
    </View>
  </TouchableOpacity>
);

const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <TouchableOpacity onPress={() => onChange(!value)} style={styles.toggleRow}>
    <CheckboxIcon checked={value} />
    <Text style={styles.toggleLabel}>{label}</Text>
  </TouchableOpacity>
);

// ========= BottomSheet genérico multi-select =========
function MultiSelectSheet({
  title,
  options,
  selected,
  onChange,
  onClose,
}: {
  title: string;
  options: QuestaoOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const sheetRef = useRef<BottomSheet>(null);
  const snaps = useMemo(() => ['100%'], []);
  const insets = useSafeAreaInsets();
  const ids = useMemo(() => options.map((opt) => opt.id), [options]);
  const allSelected = useMemo(() => ids.length > 0 && ids.every((id) => selected.includes(id)), [ids, selected]);

  const toggle = useCallback(
    (id: string) => {
      const set = new Set(selected);
      set.has(id) ? set.delete(id) : set.add(id);
      onChange([...set]);
    },
    [selected, onChange]
  );

  const toggleAll = useCallback(() => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(ids);
    }
  }, [allSelected, ids, onChange]);

  const renderItem = ({ item }: { item: QuestaoOption }) => {
    const marked = selected.includes(item.id);
    return (
      <TouchableOpacity style={styles.optionRow} onPress={() => toggle(item.id)}>
        <CheckboxIcon checked={marked} />
        <Text style={styles.optionText}>{item.nome}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snaps}
      topInset={insets.top}
      enablePanDownToClose
      onClose={onClose}
      handleIndicatorStyle={{ opacity: 0.6 }}
      backgroundStyle={styles.sheetBackground}
      backdropComponent={(p) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...p} />}
      footerComponent={(footerProps) => (
        <SheetFooter {...footerProps} onCancel={onClose} onConfirm={onClose} />
      )}
    >
      <BottomSheetFlatList
        data={options}
        keyExtractor={(o: QuestaoOption) => o.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.sheetListContent,
          {
            paddingBottom: insets.bottom + SHEET_FOOTER_HEIGHT,
            paddingHorizontal: 20,
          },
        ]}
        ListHeaderComponent={
          <SheetHeader
            title={title}
            onClose={() => sheetRef.current?.close()}
            onSelectAll={ids.length ? toggleAll : undefined}
            allSelected={allSelected}
            showSelectAll={ids.length > 0}
          />
        }
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator
      />
    </BottomSheet>
  );
}

// ========= Sheet de Assuntos com expansão =========
type AssuntoTreeItem = {
  node: AssuntoNode;
  depth: number;
  isSelectable: boolean;
  hasChildren: boolean;
  expanded: boolean;
};

function AssuntoTreeSheet({
  title,
  tree,
  selected,
  onChange,
  onClose,
}: {
  title: string;
  tree: AssuntoNode[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const sheetRef = useRef<BottomSheet>(null);
  const snaps = useMemo(() => ['100%'], []);
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const base = new Set<string>();
    tree.forEach((node) => base.add(node.id));
    setExpanded(base);
  }, [tree]);

  // 1) Índice de nós e cache de descendentes (exclui nós "matéria")
  const assuntosIndex = useMemo(() => {
    const idx = new Map<string, AssuntoNode>();
    const parent = new Map<string, string | null>();
    const directChildren = new Map<string, string[]>();

    const buildIndex = (nodes?: AssuntoNode[], parentId: string | null = null) => {
      (nodes ?? []).forEach((n) => {
        if (!n) return;
        idx.set(n.id, n);

        if (!n.isMateria) {
          parent.set(n.id, parentId);
          if (parentId) {
            const arr = directChildren.get(parentId) ?? [];
            arr.push(n.id);
            directChildren.set(parentId, arr);
          }
        }

        buildIndex(n.filhos, n.isMateria ? null : n.id);
      });
    };
    buildIndex(tree);

    const cache = new Map<string, string[]>();
    const gatherDesc = (n: AssuntoNode | undefined): string[] => {
      if (!n) return [];
      if (cache.has(n.id)) return cache.get(n.id)!;
      const acc: string[] = [];
      for (const f of n.filhos ?? []) {
        if (!f) continue;
        if (!f.isMateria) acc.push(f.id);
        const below = gatherDesc(f);
        if (below.length) acc.push(...below);
      }
      cache.set(n.id, acc);
      return acc;
    };
    tree.forEach((root) => gatherDesc(root));

    const directChildrenMap = new Map<string, string[]>();
    for (const [pid, arr] of directChildren.entries()) if (pid) directChildrenMap.set(pid, arr);

    return { nodeById: idx, parentById: parent, descendantsMap: cache, directChildrenMap };
  }, [tree]);

  const nodeById = assuntosIndex.nodeById;
  const parentById = assuntosIndex.parentById;
  const descendantsMap = assuntosIndex.descendantsMap;
  const directChildrenMap = assuntosIndex.directChildrenMap;

  const bucketOf = useCallback((id: string) => {
    const desc = descendantsMap.get(id) ?? [];
    return [id, ...desc];
  }, [descendantsMap]);

  const isFullySelected = useCallback((id: string, set: Set<string>) => {
    const all = bucketOf(id);
    for (const x of all) if (!set.has(x)) return false;
    return true;
  }, [bucketOf]);

  const getTriState = useCallback((id: string, set: Set<string>) => {
    const all = bucketOf(id);
    let count = 0;
    for (const x of all) if (set.has(x)) count++;
    if (count === 0) return 'unchecked' as const;
    if (count === all.length) return 'checked' as const;
    return 'indeterminate' as const;
  }, [bucketOf]);

  const bubbleUp = useCallback((startId: string, set: Set<string>) => {
    let cur = parentById.get(startId) ?? null;
    while (cur) {
      const children = directChildrenMap.get(cur) ?? [];
      const allChildrenFullySelected = children.every((ch) => isFullySelected(ch, set));
      if (allChildrenFullySelected) set.add(cur);
      else set.delete(cur);
      cur = parentById.get(cur) ?? null;
    }
  }, [parentById, directChildrenMap, isFullySelected]);

  // 2) Lista "achatada" para o FlatList (igual ao seu código atual)
  const data = useMemo<AssuntoTreeItem[]>(() => {
    const rows: AssuntoTreeItem[] = [];

    const walk = (nodes: AssuntoNode[] | undefined, depth: number) => {
      if (!nodes) return;

      nodes.forEach((node) => {
        if (!node) return;

        const hasChildren = Boolean(node.filhos?.length);
        const isExpanded = expanded.has(node.id);
        const isMateria = Boolean(node.isMateria);

        if (!isMateria) {
          rows.push({
            node,
            depth,
            isSelectable: true,
            hasChildren,
            expanded: hasChildren ? isExpanded : false,
          });
        }

        if (hasChildren && (isExpanded || isMateria)) {
          walk(node.filhos, isMateria ? depth : depth + 1);
        }
      });
    };

    walk(tree, 0);
    return rows;
  }, [tree, expanded]);

  const toggleSelection = useCallback(
    (id: string) => {
      const set = new Set(selected);

      const node = nodeById.get(id);
      if (!node) return;

      const bucket = bucketOf(id);
      const selecting = !set.has(id);

      if (selecting) {
        for (const x of bucket) set.add(x);
        bubbleUp(id, set);
      } else {
        for (const x of bucket) set.delete(x);
        bubbleUp(id, set);
      }

      onChange([...set]);
    },
    [selected, onChange, nodeById, bucketOf, bubbleUp]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelectableIds = useMemo(() => {
    const ids: string[] = [];
    nodeById.forEach((node) => {
      if (!node.isMateria) ids.push(node.id);
    });
    return ids;
  }, [nodeById]);

  const allSelected = useMemo(
    () => allSelectableIds.length > 0 && allSelectableIds.every((id) => selected.includes(id)),
    [allSelectableIds, selected]
  );

  const toggleAll = useCallback(() => {
    if (allSelected) onChange([]);
    else onChange(allSelectableIds);
  }, [allSelected, allSelectableIds, onChange]);

  const renderItem: ListRenderItem<AssuntoTreeItem> = ({ item }) => {
    const { node, depth, isSelectable, hasChildren, expanded: isExpanded } = item;
    const selSet = new Set(selected);
    const state = isSelectable ? getTriState(node.id, selSet) : 'unchecked';
    const label = (node.titulo ?? "").trim() || node.id;

    return (
      <View style={[styles.assuntoRow, { paddingLeft: 12 + depth * 18 }]}>
        {hasChildren ? (
          <TouchableOpacity
            onPress={() => toggleExpand(node.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.assuntoExpandButton}
          >
            <Text style={styles.assuntoExpandText}>{isExpanded ? "−" : "+"}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.assuntoExpandPlaceholder} />
        )}

        {isSelectable ? (
          <TouchableOpacity
            onPress={() => toggleSelection(node.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.assuntoCheckboxWrapper}
          >
            <CheckboxIcon
              checked={state === "checked"}
              indeterminate={state === "indeterminate"}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.assuntoCheckboxWrapper} />
        )}

        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.8}
          onPress={() => {
            if (isSelectable) {
              toggleSelection(node.id);
            } else if (hasChildren) {
              toggleExpand(node.id);
            }
          }}
        >
          <Text style={[styles.optionText, !isSelectable && styles.assuntoMateriaLabel]}>{label}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snaps}
      topInset={insets.top}
      enablePanDownToClose
      onClose={onClose}
      handleIndicatorStyle={{ opacity: 0.6 }}
      backgroundStyle={styles.sheetBackground}
      backdropComponent={(p) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...p} />}
      footerComponent={(footerProps) => (
        <SheetFooter {...footerProps} onCancel={onClose} onConfirm={onClose} />
      )}
    >
      <BottomSheetFlatList
        data={data}
        keyExtractor={(item: AssuntoTreeItem) => item.node.id}
        renderItem={renderItem}
        extraData={selected}
        contentContainerStyle={[
          styles.sheetListContent,
          {
            paddingBottom: insets.bottom + SHEET_FOOTER_HEIGHT,
            paddingHorizontal: 20,
          },
        ]}
        ListHeaderComponent={
          <SheetHeader
            title={title}
            onClose={() => sheetRef.current?.close()}
            onSelectAll={toggleAll}
            allSelected={allSelected}
          />
        }
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator
      />
    </BottomSheet>
  );
}

// ========= Lista de Questões =========
function QuestoesList({ filtros, onTotalChange }: { filtros: QuestoesFiltros; onTotalChange?: (total: number) => void }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<QuestaoListItem[]>([]);
  const [total, setTotal] = useState<number>(0);

  const load = useCallback(async (targetPage: number, reset = false) => {
    try {
      setLoading(true);

      const [list, totalCount] = await Promise.all([
        listarQuestoes<QuestaoListItem>(filtros, targetPage, pageSize),
        contarQuestoes(filtros),
      ]);

      setTotal(totalCount);
      onTotalChange?.(totalCount);
      setItems((prev) => (reset ? list.items : [...prev, ...list.items]));
    } finally {
      setLoading(false);
    }
  }, [filtros, onTotalChange]);

  // Função de recarregamento silencioso (sem mostrar loading)
  const recarregarSilencioso = useCallback(async () => {
    try {
      const [list, totalCount] = await Promise.all([
        listarQuestoes<QuestaoListItem>(filtros, 1, pageSize),
        contarQuestoes(filtros),
      ]);

      setTotal(totalCount);
      onTotalChange?.(totalCount);
      setItems(list.items);
      setPage(1);
    } catch (e: any) {
      // Erro silencioso - não mostra mensagem para não interromper a experiência
    }
  }, [filtros, onTotalChange, pageSize]);

  useEffect(() => {
    // sempre que filtros mudarem, resetar paginação
    setPage(1);
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros)]);

  // Recarregar quando a tela ganha foco (silenciosamente)
  const initialLoadedRef = useRef(false);
  useEffect(() => {
    initialLoadedRef.current = true;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (initialLoadedRef.current) {
        recarregarSilencioso();
      }
    }, [recarregarSilencioso])
  );

  const canLoadMore = items.length < total;

  return (
    <View style={{ flex: 1 }}>
      {loading && items.length === 0 ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(q) => q.id}
          renderItem={({ item }) => <QuestaoCard questao={item} />}
          contentContainerStyle={{ paddingVertical: 12 }}
          ListFooterComponent={() => (
            <View style={{ padding: 16 }}>
              {canLoadMore ? (
                <TouchableOpacity
                  disabled={loading}
                  style={styles.loadMore}
                  onPress={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    load(nextPage);
                  }}
                >
                  {loading ? <ActivityIndicator /> : <Text style={styles.loadMoreText}>Carregar mais</Text>}
                </TouchableOpacity>
              ) : (
                <Text style={styles.endText}>Fim da lista</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

// ========= Tela principal =========
export default function QuestoesScreen() {
  const [tab, setTab] = useState<"simulados" | "playground">("simulados");
  const router = useRouter();

  // opções
  const [materias, setMaterias] = useState<QuestaoOption[]>([]);
  const [instituicoes, setInstituicoes] = useState<QuestaoOption[]>([]);
  const [classes, setClasses] = useState<QuestaoOption[]>([]);
  const [fases, setFases] = useState<QuestaoOption[]>([]);
  const [graus, setGraus] = useState<QuestaoOption[]>([]);
  const [series, setSeries] = useState<QuestaoOption[]>([]);
  const [anos, setAnos] = useState<QuestaoOption[]>([]);
  const [totalQuestoes, setTotalQuestoes] = useState<number | null>(null);
  const [totalLoading, setTotalLoading] = useState<boolean>(false);

  // assuntos árvore (dependem da(s) matéria(s))
  const [assuntosTree, setAssuntosTree] = useState<AssuntoNode[]>([]);

  // seleções
  const [selMaterias, setSelMaterias] = useState<string[]>([]);
  const [selAssuntos, setSelAssuntos] = useState<string[]>([]);
  const [selTipos, setSelTipos] = useState<string[]>([]);
  const [selInstituicoes, setSelInstituicoes] = useState<string[]>([]);
  const [selClasses, setSelClasses] = useState<string[]>([]);
  const [selFases, setSelFases] = useState<string[]>([]);
  const [selGraus, setSelGraus] = useState<string[]>([]);
  const [selSeries, setSelSeries] = useState<string[]>([]);
  const [selAnos, setSelAnos] = useState<string[]>([]);
  const [openSimuladoSheet, setOpenSimuladoSheet] = useState(false);

  const materiasMap = useMemo(() => {
    const map = new Map<string, string>();
    materias.forEach((opt) => map.set(opt.id, opt.nome));
    return map;
  }, [materias]);

  const instituicoesMap = useMemo(() => {
    const map = new Map<string, string>();
    instituicoes.forEach((opt) => map.set(opt.id, opt.nome));
    return map;
  }, [instituicoes]);

  const classesMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((opt) => map.set(opt.id, opt.nome));
    return map;
  }, [classes]);

  const fasesMap = useMemo(() => {
    const map = new Map<string, string>();
    fases.forEach((opt) => map.set(opt.id, opt.nome));
    return map;
  }, [fases]);

  const grausMap = useMemo(() => {
    const map = new Map<string, string>();
    graus.forEach((opt) => map.set(opt.id, opt.nome));
    return map;
  }, [graus]);

  const seriesMap = useMemo(() => {
    const map = new Map<string, string>();
    series.forEach((opt) => map.set(opt.id, opt.nome));
    return map;
  }, [series]);

  const anosMap = useMemo(() => {
    const map = new Map<string, string>();
    anos.forEach((opt) => map.set(opt.id, opt.nome));
    return map;
  }, [anos]);

  const tiposMap = useMemo(() => {
    const map = new Map<string, string>();
    TIPOS_QUESTAO.forEach((opt) => map.set(opt.id, opt.nome));
    return map;
  }, []);

  const materiasSummary = useMemo(() => summarizeLabels(
    selMaterias.map((id) => materiasMap.get(id) ?? "").filter(Boolean) as string[]
  ), [selMaterias, materiasMap]);

  const assuntosNomePorId = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (nodes?: AssuntoNode[]) => {
      (nodes ?? []).forEach((n) => {
        if (!n) return;
        if (!n.isMateria) map.set(n.id, (n.titulo ?? "").trim() || n.id);
        if (n.filhos?.length) walk(n.filhos);
      });
    };
    walk(assuntosTree);
    return map;
  }, [assuntosTree]);

  const assuntosSummary = useMemo(() => summarizeLabels(
    selAssuntos.map((id) => assuntosNomePorId.get(id) ?? "").filter(Boolean) as string[]
  ), [selAssuntos, assuntosNomePorId]);

  const tiposSummary = useMemo(() => summarizeLabels(
    selTipos.map((id) => tiposMap.get(id) ?? "").filter(Boolean) as string[]
  ), [selTipos, tiposMap]);

  const instituicoesSummary = useMemo(() => summarizeLabels(
    selInstituicoes.map((id) => instituicoesMap.get(id) ?? "").filter(Boolean) as string[]
  ), [selInstituicoes, instituicoesMap]);

  const classesSummary = useMemo(() => summarizeLabels(
    selClasses.map((id) => classesMap.get(id) ?? "").filter(Boolean) as string[]
  ), [selClasses, classesMap]);

  const fasesSummary = useMemo(() => summarizeLabels(
    selFases.map((id) => fasesMap.get(id) ?? "").filter(Boolean) as string[]
  ), [selFases, fasesMap]);

  const grausSummary = useMemo(() => summarizeLabels(
    selGraus.map((id) => grausMap.get(id) ?? "").filter(Boolean) as string[]
  ), [selGraus, grausMap]);

  const seriesSummary = useMemo(() => summarizeLabels(
    selSeries.map((id) => seriesMap.get(id) ?? "").filter(Boolean) as string[]
  ), [selSeries, seriesMap]);

  const anosSummary = useMemo(() => summarizeLabels(
    selAnos.map((id) => anosMap.get(id) ?? "").filter(Boolean) as string[]
  ), [selAnos, anosMap]);

  // toggles
  const [excluirSomenteErradas, setExcluirSomenteErradas] = useState(false);
  const [excluirAcertadas, setExclAcertadas] = useState(false);
  const [excluirNaoComentadas, setExclNaoComentadas] = useState(false);

  // UI: estado de filtros recolhidos (Playground)
  const [showPlaygroundFiltros, setShowPlaygroundFiltros] = useState(false);

  // sheets abertos
  const [sheet, setSheet] = useState<null | { key: string; title: string }>(null);

  // ===== Carregar opções base =====
useEffect(() => {
  let active = true;

  (async () => {
    const [mats, insts, grausResp, seriesResp, anosResp] = await Promise.allSettled([
      buscarMaterias(),
      buscarInstituicoes(),
      buscarGraus(),
      buscarSeries(),
      buscarAnos(),
    ]);

    if (!active) return;

    if (mats.status === "fulfilled") {
      setMaterias(mats.value);
    } else {
      console.error("Falha ao carregar matérias:", mats.reason);
    }

    if (insts.status === "fulfilled") {
      setInstituicoes(insts.value);
    } else {
      console.error("Falha ao carregar instituições:", insts.reason);
    }

    if (grausResp.status === "fulfilled") {
      setGraus(grausResp.value);
    } else {
      console.error("Falha ao carregar graus:", grausResp.reason);
    }

    if (seriesResp.status === "fulfilled") {
      setSeries(seriesResp.value);
    } else {
      console.error("Falha ao carregar séries:", seriesResp.reason);
    }

    if (anosResp.status === "fulfilled") {
      setAnos(anosResp.value);
    } else {
      console.error("Falha ao carregar anos:", anosResp.reason);
    }
  })();

  return () => {
    active = false;
  };
}, []);

  // ===== Dependências: Assuntos ← Matérias =====
  useEffect(() => {
    if (selMaterias.length === 0) {
      setAssuntosTree([]);
      setSelAssuntos([]);
      return;
    }
  buscarAssuntosTree(selMaterias).then(setAssuntosTree).catch(console.error);
  }, [selMaterias]);

  // ===== Dependências: Classes ← Instituições =====
  useEffect(() => {
    if (selInstituicoes.length === 0) {
      setClasses([]);
      setSelClasses([]);
      return;
    }
  buscarClasses(selInstituicoes)
    .then((rows) => setClasses(rows))
    .catch(console.error);
  }, [selInstituicoes]);

  // ===== Dependências: Fases ← Instituições (+ opcionais Classes) =====
  useEffect(() => {
    if (selInstituicoes.length === 0) {
      setFases([]);
      setSelFases([]);
      return;
    }
  buscarFases(selInstituicoes[0], selClasses)
    .then((rows) => setFases(rows))
    .catch(console.error);
  }, [selInstituicoes, selClasses]);

  // ===== Filtros consolidados p/ API =====
  const filtros = useMemo(() => ({
    materiaId: selMaterias,
    assuntoId: selAssuntos,
    tipo: selTipos,
    instituicaoId: selInstituicoes,
    classeId: selClasses,
    faseId: selFases,
    grauDificuldadeId: selGraus,
    serieEscolarId: selSeries,
    anoId: selAnos,
    excluirSomenteErradas,
    excluirAcertadas,
    excluirNaoComentadas,
  }), [selMaterias, selAssuntos, selTipos, selInstituicoes, selClasses, selFases, selGraus, selSeries, selAnos, excluirSomenteErradas, excluirAcertadas, excluirNaoComentadas]);

  // ===== Atualiza total de questões conforme filtros =====
  useEffect(() => {
    let active = true;
    (async () => {
      setTotalLoading(true);
      try {
        const total = await contarQuestoes(filtros);
        if (active) setTotalQuestoes(total);
      } catch {
        if (active) setTotalQuestoes(null);
      } finally {
        if (active) setTotalLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [filtros]);

  // ===== Layout =====
  const handleOpenAssunto = () => {
    if (!selMaterias.length) {
      Alert.alert("Selecione uma matéria", "Escolha ao menos uma matéria antes de filtrar por assunto.");
      return;
    }
    setSheet({ key: "assunto", title: "Assunto" });
  };

  const handleOpenClasse = () => {
    if (!selInstituicoes.length) {
      Alert.alert("Selecione uma instituição", "Escolha ao menos uma instituição antes de filtrar por classe.");
      return;
    }
    setSheet({ key: "classe", title: "Classe" });
  };

  const handleOpenFase = () => {
    if (!selInstituicoes.length) {
      Alert.alert("Selecione uma instituição", "Escolha ao menos uma instituição antes de filtrar por fase.");
      return;
    }
    setSheet({ key: "fase", title: "Fase" });
  };

  const FiltersBlock = (
    <View>
      <View style={styles.filtersList}>
        <FilterRow
          icon={BookOpen}
          label="Matéria"
          summary={materiasSummary}
          hasSelection={selMaterias.length > 0}
          onPress={() => setSheet({ key: "materia", title: "Matéria" })}
        />
        <FilterRow
          icon={ListTree}
          label="Assunto"
          summary={assuntosSummary}
          hasSelection={selAssuntos.length > 0}
          onPress={handleOpenAssunto}
        />
        <FilterRow
          icon={ListChecks}
          label="Tipo de questão"
          summary={tiposSummary}
          hasSelection={selTipos.length > 0}
          onPress={() => setSheet({ key: "tipo", title: "Tipo de Questão" })}
        />
        <FilterRow
          icon={Building}
          label="Instituição"
          summary={instituicoesSummary}
          hasSelection={selInstituicoes.length > 0}
          onPress={() => setSheet({ key: "instituicao", title: "Instituição" })}
        />
        <FilterRow
          icon={Layers}
          label="Classe"
          summary={classesSummary}
          hasSelection={selClasses.length > 0}
          onPress={handleOpenClasse}
        />
        <FilterRow
          icon={Target}
          label="Fase"
          summary={fasesSummary}
          hasSelection={selFases.length > 0}
          onPress={handleOpenFase}
        />
        <FilterRow
          icon={Gauge}
          label="Grau de dificuldade"
          summary={grausSummary}
          hasSelection={selGraus.length > 0}
          onPress={() => setSheet({ key: "grau", title: "Grau de Dificuldade" })}
        />
        <FilterRow
          icon={GraduationCap}
          label="Série escolar"
          summary={seriesSummary}
          hasSelection={selSeries.length > 0}
          onPress={() => setSheet({ key: "serie", title: "Série Escolar" })}
        />
        <FilterRow
          icon={CalendarDays}
          label="Ano"
          summary={anosSummary}
          hasSelection={selAnos.length > 0}
          isLast
          onPress={() => setSheet({ key: "ano", title: "Ano" })}
        />
      </View>

      <View style={styles.togglesBox}>
        <Toggle label="Excluir questões que errei" value={excluirSomenteErradas} onChange={setExcluirSomenteErradas} />
        <Toggle label="Excluir questões que acertei" value={excluirAcertadas} onChange={setExclAcertadas} />
        <Toggle label="Excluir questões sem comentários" value={excluirNaoComentadas} onChange={setExclNaoComentadas} />
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <AlunoHeaderSummary style={styles.alunoHeader} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Questões</Text>
        </View>

        {/* Abas */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === "simulados" && styles.tabActive]} onPress={() => setTab("simulados")}>
            <Text style={[styles.tabText, tab === "simulados" && styles.tabTextActive]}>Simulados</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === "playground" && styles.tabActive]} onPress={() => setTab("playground")}>
            <Text style={[styles.tabText, tab === "playground" && styles.tabTextActive]}>Playground</Text>
          </TouchableOpacity>
        </View>

        {tab === "simulados" ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}>
            <SectionTitle>Criar Simulado</SectionTitle>

            {FiltersBlock}

            {/* contador + CTA */}
    <View style={styles.simuladoCardWrapper}>
      <LinearGradient
        colors={["#FF3CAC", "#FF6BBB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.simuladoCard}
      >
        <View>
          {totalLoading ? (
            <View style={styles.simuladoLoadingRow}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <>
              <Text style={styles.simuladoCountValue}>
                {(totalQuestoes ?? 0).toLocaleString("pt-BR")}
              </Text>
              <Text style={styles.simuladoCountLabel}>
                Questões encontradas
              </Text>
            </>
          )}
        </View>
        <TouchableOpacity
          style={styles.simuladoActionBtn}
          onPress={() => setOpenSimuladoSheet(true)}
        >
          <Text style={styles.simuladoActionText}>Gerar simulado</Text>
          <Ionicons name="chevron-forward" size={16} color="#FF2E88" />
        </TouchableOpacity>
      </LinearGradient>
    </View>

            {/* botão secundário */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/simulados/meusSimulados')}
            >
              <Text style={styles.secondaryBtnText}>Ver todos os meus simulados</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Filtros recolhidos/expandidos */}
            <TouchableOpacity style={[styles.collapsible, { paddingHorizontal: 20 }]} onPress={() => setShowPlaygroundFiltros((v) => !v)}>
              <Text style={styles.collapsibleTitle} />
              <Ionicons name={showPlaygroundFiltros ? "chevron-up" : "chevron-down"} size={18} />
            </TouchableOpacity>
            {showPlaygroundFiltros && (
              <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingBottom: 12, paddingHorizontal: 20 }}>
                {FiltersBlock}
              </ScrollView>
            )}

            {/* Lista de questões */}
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              <QuestoesList filtros={filtros} onTotalChange={setTotalQuestoes} />
            </View>
          </View>
        )}

        {/* Bottom Sheets */}
        {sheet?.key === "materia" && (
          <MultiSelectSheet title={sheet.title} options={materias} selected={selMaterias} onChange={setSelMaterias} onClose={() => setSheet(null)} />
        )}
        {sheet?.key === "assunto" && (
          <AssuntoTreeSheet title={sheet.title} tree={assuntosTree} selected={selAssuntos} onChange={setSelAssuntos} onClose={() => setSheet(null)} />
        )}
        {sheet?.key === "tipo" && (
          <MultiSelectSheet title={sheet.title} options={TIPOS_QUESTAO} selected={selTipos} onChange={setSelTipos} onClose={() => setSheet(null)} />
        )}
        {sheet?.key === "instituicao" && (
          <MultiSelectSheet title={sheet.title} options={instituicoes} selected={selInstituicoes} onChange={setSelInstituicoes} onClose={() => setSheet(null)} />
        )}
        {sheet?.key === "classe" && (
          <MultiSelectSheet title={sheet.title} options={classes} selected={selClasses} onChange={setSelClasses} onClose={() => setSheet(null)} />
        )}
        {sheet?.key === "fase" && (
          <MultiSelectSheet title={sheet.title} options={fases} selected={selFases} onChange={setSelFases} onClose={() => setSheet(null)} />
        )}
        {sheet?.key === "grau" && (
          <MultiSelectSheet title={sheet.title} options={graus} selected={selGraus} onChange={setSelGraus} onClose={() => setSheet(null)} />
        )}
        {sheet?.key === "serie" && (
          <MultiSelectSheet title={sheet.title} options={series} selected={selSeries} onChange={setSelSeries} onClose={() => setSheet(null)} />
        )}
        {sheet?.key === "ano" && (
          <MultiSelectSheet title={sheet.title} options={anos} selected={selAnos} onChange={setSelAnos} onClose={() => setSheet(null)} />
        )}

        <GenerateSimuladoSheet
          open={openSimuladoSheet}
          onClose={() => setOpenSimuladoSheet(false)}
          filtroMateriaIds={selMaterias}
          filtroAssuntoIds={selAssuntos}
          filtroAnoIds={selAnos}
          filtroInstituicaoIds={selInstituicoes}
          filtroClasseIds={selClasses}
          filtroGrauIds={selGraus}
          filtroSerieEscolarIds={selSeries}
          excluirSomenteErradas={excluirSomenteErradas}
          excluirAcertadas={excluirAcertadas}
          onCreated={(simuladoId) => {
            setOpenSimuladoSheet(false);
          router.push(`/simulados/${simuladoId}/resumo`);
          }}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ========= Estilos =========
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  alunoHeader: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    color: "#333",
    fontFamily: "PlusJakartaSans-Bold",
  },
  tabs: { flexDirection: "row", backgroundColor: "#f2f2f2", borderRadius: 12, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: "#333", fontFamily: "Inter" },
  tabTextActive: { fontWeight: "700", color: "#111", fontFamily: "Inter-Bold" },

  sectionTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter-SemiBold", marginVertical: 8 },
  filtersList: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
  },
  sheetBackground: {
    backgroundColor: "#FFFFFF",
  },
  sheetContainer: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sheetTop: {
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },
  sheetList: {
    flex: 1,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#EEF2F7",
    backgroundColor: "#FFF",
  },
  filterRowLast: {
    borderBottomWidth: 0,
  },
  filterRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filterRowLabel: {
    fontSize: 15,
    color: "#4B5563",
    fontFamily: "Inter",
  },
  filterRowRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    flexShrink: 1,
  },
  filterRowSummary: {
    flexShrink: 1,
    textAlign: "right",
    color: "#4B5563",
    fontSize: 12,
  },
  sheetListContent: {},

  togglesBox: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 10, marginTop: 12, gap: 8 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleLabel: { fontSize: 14, color: "#4B5563" },

  gradientBox: { marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: "#111", overflow: "hidden" },
  gradientText: { color: "#fff", marginBottom: 12 },
  primaryBtn: { backgroundColor: "#f59e0b", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#111", fontWeight: "800" },
  secondaryBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb" },
  secondaryBtnText: { color: "#111" },

  simuladoCardWrapper: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  simuladoCard: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  simuladoLoadingRow: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  simuladoCountValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  simuladoCountLabel: {
    color: "#FFE4F7",
  },
  simuladoActionBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  simuladoActionText: {
    color: "#FF2E88",
    fontWeight: "700",
  },

  collapsible: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#eee" },
  collapsibleTitle: { fontSize: 16, fontWeight: "700" },

  loadMore: { borderWidth: 1, borderColor: "#e5e7eb", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  loadMoreText: { fontWeight: "700" },
  endText: { textAlign: "center", color: "#6b7280" },

  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  optionText: { fontSize: 14, color: "#4B5563" },

  assuntoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 16,
    gap: 8,
  },
  assuntoExpandButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  assuntoExpandText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 20,
  },
  assuntoExpandPlaceholder: {
    width: 24,
    height: 24,
  },
  assuntoCheckboxWrapper: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  assuntoMateriaLabel: {
    fontWeight: "700",
    color: "#1F2937",
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});


