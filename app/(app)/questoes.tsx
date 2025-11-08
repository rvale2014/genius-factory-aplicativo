// app/(app)/questoes
// Tela completa com abas "Simulados" e "Playground", filtros com Bottom Sheet multi-select
// e listagem paginada (5/pg) consumindo as rotas mobile/v1 já criadas.

import { AlunoHeaderSummary } from "@/components/AlunoHeaderSummary";
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
import { SafeAreaView } from "react-native-safe-area-context";

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

type QuestaoCard = {
  id: string;
  codigo: string;
  tipo: string;
  enunciado: string;
  imagemUrl?: string | null;
  materia?: { nome: string } | null;
  grauDificuldade?: { nome: string } | null;
  ano?: { nome: string } | null;
};

// ========= Componentes de UI =========
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

const FilterRow = ({
  icon: Icon,
  label,
  onPress,
  isLast,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.filterRow, isLast && styles.filterRowLast]}
    activeOpacity={0.75}
    onPress={onPress}
  >
    <View style={styles.filterRowLeft}>
      <Icon size={18} color="#1F2937" strokeWidth={2} />
    <Text style={styles.filterRowLabel}>{label}</Text>
    </View>
    <Text style={styles.filterRowPlus}>+</Text>
  </TouchableOpacity>
);

const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <TouchableOpacity onPress={() => onChange(!value)} style={styles.toggleRow}>
    <Ionicons name={value ? "checkbox" : "square-outline"} size={22} color={value ? "#2563eb" : "#444"} />
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
  const snaps = useMemo(() => ["50%", "85%"], []);

  const toggle = useCallback((id: string) => {
    const set = new Set(selected);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange([...set]);
  }, [selected, onChange]);

  const renderItem = ({ item }: { item: QuestaoOption }) => {
    const marked = selected.includes(item.id);
    return (
      <TouchableOpacity style={styles.optionRow} onPress={() => toggle(item.id)}>
        <Ionicons name={marked ? "checkbox" : "square-outline"} size={22} color={marked ? "#2563eb" : "#444"} />
        <Text style={styles.optionText}>{item.nome}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={1}
      snapPoints={snaps}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={(p) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...p} />}
    >
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <TouchableOpacity onPress={() => sheetRef.current?.close()}>
          <Ionicons name="close" size={22} />
        </TouchableOpacity>
      </View>
      <BottomSheetFlatList data={options} keyExtractor={(o: QuestaoOption) => o.id} renderItem={renderItem} />
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
  const snaps = useMemo(() => ["60%", "90%"], []);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const base = new Set<string>();
    tree.forEach((node) => base.add(node.id));
    setExpanded(base);
  }, [tree]);

  // 1) Índice de nós e cache de descendentes (exclui nós "matéria")
  const { nodeById, parentById, descendantsMap, directChildrenMap } = useMemo(() => {
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

  const renderItem: ListRenderItem<AssuntoTreeItem> = ({ item }) => {
    const { node, depth, isSelectable, hasChildren, expanded: isExpanded } = item;
    const selSet = new Set(selected);
    const state = isSelectable ? getTriState(node.id, selSet) : 'unchecked';
    const iconName =
      state === 'checked'
        ? 'checkbox'
        : state === 'indeterminate'
          ? 'remove-outline'
          : 'square-outline';
    const iconColor = state === 'unchecked' ? '#444' : '#2563eb';
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
            <Ionicons
              name={iconName as any}
              size={22}
              color={iconColor}
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
              toggleSelection(node.id); // também aplica cascata via rótulo
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
      index={1}
      snapPoints={snaps}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={(p) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...p} />}
    >
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <TouchableOpacity onPress={() => sheetRef.current?.close()}>
          <Ionicons name="close" size={22} />
        </TouchableOpacity>
      </View>

      <BottomSheetFlatList
        data={data}
        keyExtractor={(item: AssuntoTreeItem) => item.node.id}
        renderItem={renderItem}
        extraData={selected}
      />
    </BottomSheet>
  );
}

// ========= Lista de Questões =========
function QuestoesList({ filtros }: { filtros: QuestoesFiltros }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<QuestaoCard[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (targetPage: number, reset = false) => {
    try {
      setLoading(true);

      const [list, totalCount] = await Promise.all([
        listarQuestoes<QuestaoCard>(filtros, targetPage, pageSize),
        contarQuestoes(filtros),
      ]);

      setTotal(totalCount);
      setItems((prev) => (reset ? list.items : [...prev, ...list.items]));
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    // sempre que filtros mudarem, resetar paginação
    setPage(1);
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros)]);

  const canLoadMore = items.length < total;

  return (
    <View style={{ flex: 1 }}>
      {loading && items.length === 0 ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(q) => q.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardCode}>{item.codigo}</Text>
                <Text style={styles.cardType}>{item.tipo}</Text>
              </View>
              <Text numberOfLines={4} style={styles.cardText}>{item.enunciado}</Text>
              <View style={styles.metaRow}>
                {!!item.materia?.nome && <Text style={styles.metaChip}>{item.materia?.nome}</Text>}
                {!!item.grauDificuldade?.nome && <Text style={styles.metaChip}>{item.grauDificuldade?.nome}</Text>}
                {!!item.ano?.nome && <Text style={styles.metaChip}>{item.ano?.nome}</Text>}
              </View>
            </View>
          )}
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

  // opções
  const [materias, setMaterias] = useState<QuestaoOption[]>([]);
  const [instituicoes, setInstituicoes] = useState<QuestaoOption[]>([]);
  const [classes, setClasses] = useState<QuestaoOption[]>([]);
  const [fases, setFases] = useState<QuestaoOption[]>([]);
  const [graus, setGraus] = useState<QuestaoOption[]>([]);
  const [series, setSeries] = useState<QuestaoOption[]>([]);
  const [anos, setAnos] = useState<QuestaoOption[]>([]);

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
      <SectionTitle>Filtros</SectionTitle>

      <View style={styles.filtersList}>
        <FilterRow
          icon={BookOpen}
          label="Matéria"
          onPress={() => setSheet({ key: "materia", title: "Matéria" })}
        />
        <FilterRow
          icon={ListTree}
          label="Assunto"
          onPress={handleOpenAssunto}
        />
        <FilterRow
          icon={ListChecks}
          label="Tipo de questão"
          onPress={() => setSheet({ key: "tipo", title: "Tipo de Questão" })}
        />
        <FilterRow
          icon={Building}
          label="Instituição"
          onPress={() => setSheet({ key: "instituicao", title: "Instituição" })}
        />
        <FilterRow
          icon={Layers}
          label="Classe"
          onPress={handleOpenClasse}
        />
        <FilterRow
          icon={Target}
          label="Fase"
          onPress={handleOpenFase}
        />
        <FilterRow
          icon={Gauge}
          label="Grau de dificuldade"
          onPress={() => setSheet({ key: "grau", title: "Grau de Dificuldade" })}
        />
        <FilterRow
          icon={GraduationCap}
          label="Série escolar"
          onPress={() => setSheet({ key: "serie", title: "Série Escolar" })}
        />
        <FilterRow
          icon={CalendarDays}
          label="Ano"
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
            <SectionTitle>Criar Novo Simulado</SectionTitle>

            {FiltersBlock}

            {/* bloco degradê + CTA */}
            <View style={styles.gradientBox}>
              <Text style={styles.gradientText}>Monte um simulado com base nos filtros selecionados</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => {/* navega para fluxo de criação */}}>
                <Text style={styles.primaryBtnText}>Gerar Simulado</Text>
              </TouchableOpacity>
            </View>

            {/* botão secundário */}
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => {/* navega para lista de simulados */}}>
              <Text style={styles.secondaryBtnText}>Ver todos os meus simulados</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Filtros recolhidos/expandidos */}
            <TouchableOpacity style={[styles.collapsible, { paddingHorizontal: 20 }]} onPress={() => setShowPlaygroundFiltros((v) => !v)}>
              <Text style={styles.collapsibleTitle}>Filtros</Text>
              <Ionicons name={showPlaygroundFiltros ? "chevron-up" : "chevron-down"} size={18} />
            </TouchableOpacity>
            {showPlaygroundFiltros && (
              <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingBottom: 12, paddingHorizontal: 20 }}>
                {FiltersBlock}
              </ScrollView>
            )}

            {/* Lista de questões */}
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              <QuestoesList filtros={filtros} />
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
    fontWeight: "700",
    color: "#333",
  },
  tabs: { flexDirection: "row", backgroundColor: "#f2f2f2", borderRadius: 12, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: "#333" },
  tabTextActive: { fontWeight: "700", color: "#111" },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginVertical: 8 },
  filtersList: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
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
    color: "#1F2937",
  },
  filterRowPlus: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FF2E88",
  },

  togglesBox: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 10, marginTop: 12, gap: 8 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleLabel: { fontSize: 14, color: "#222" },

  gradientBox: { marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: "#111", overflow: "hidden" },
  gradientText: { color: "#fff", marginBottom: 12 },
  primaryBtn: { backgroundColor: "#f59e0b", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#111", fontWeight: "800" },
  secondaryBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb" },
  secondaryBtnText: { color: "#111", fontWeight: "700" },

  collapsible: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#eee" },
  collapsibleTitle: { fontSize: 16, fontWeight: "700" },

  card: { marginHorizontal: 4, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 12, backgroundColor: "#fff" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cardCode: { fontWeight: "800", color: "#111" },
  cardType: { color: "#6b7280" },
  cardText: { color: "#111" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  metaChip: { backgroundColor: "#f3f4f6", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, color: "#111" },

  loadMore: { borderWidth: 1, borderColor: "#e5e7eb", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  loadMoreText: { fontWeight: "700" },
  endText: { textAlign: "center", color: "#6b7280" },

  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  optionText: { fontSize: 14 },

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


