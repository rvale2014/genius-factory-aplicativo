// components/qbank/QuestaoPlayer.tsx
import {
  corrigirBlocoRapido,
  corrigirCompletar,
  corrigirCompletarTopo,
  corrigirDissertativa,
  corrigirLigarColunas,
  corrigirMultiplaEscolhaOuCertaErrada,
  corrigirObjetivaCurta,
  corrigirSelecaoMultipla,
} from "@/src/services/respostasService";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Tipagem “enxuta” vinda do seu /mobile/v1/qbank/questoes
export type QuestaoData = {
  id: string;
  codigo: string;
  tipo: string;
  enunciado: string;
  imagemUrl?: string | null;
  alternativas?: string[] | null;        // multipla_escolha / certa_errada
  respostaCorreta?: string | null;       // NÃO usar no cliente
  respostasAceitas?: string[] | null;    // objetiva_curta
  respostaModelo?: string | null;        // dissertativa
  orientacaoCorrecao?: string | null;    // dissertativa
  blocoRapido?: any;                     // [{respostasAceitas: []}, ...]
  ligarColunas?: any;                    // coluna A: [{ladoB, imagemB?}]
  conteudo?: any;                        // selecao_multipla | completar | completar_topo | tabela | colorir_figura
};

type Props = {
  questao: QuestaoData;
  onChange?: (snapshot: any) => void;
  refKey?: string;
};

export default function QuestaoPlayer({ questao }: Props) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Estados por tipo
  const [respLetra, setRespLetra] = useState<string | null>(null);           // multipla/certa-errada
  const [respSelecaoMultipla, setRespSelecaoMultipla] = useState<string[]>([]); // selecao_multipla
  const [respObjetivaCurta, setRespObjetivaCurta] = useState("");
  const [respDissertativa, setRespDissertativa] = useState("");

  const [respBlocoRapido, setRespBlocoRapido] = useState<string[]>([]);
  const [respCompletar, setRespCompletar] = useState<string[]>([]);
  const [respCompletarTopo, setRespCompletarTopo] = useState<Array<{ lacunaId: string; valor: string }>>([]);

  // Ligar colunas (UI simples: aluno digita o número da linha A para cada item de B)
  const [respLigar, setRespLigar] = useState<Record<string, any>>({ _colunaB: [] });

  const tipo = questao.tipo;

  // Conteúdos canônicos
  const conteudo = useMemo(() => {
    if (!questao.conteudo) return null;
    if (typeof questao.conteudo === "string") {
      try { return JSON.parse(questao.conteudo); } catch { return null; }
    }
    return questao.conteudo;
  }, [questao.conteudo]);

  // Preparos por tipo
  const alternativas = (questao.alternativas ?? []) as string[];
  const isCertaErrada = tipo === "certa_errada";
  const letras = useMemo(() => alternativas.map((_, i) => String.fromCharCode(65 + i)), [alternativas]); // A,B,C...

  // selecao_multipla: conteudo.corretas = string[] (ids); conteudo.alternativas = [{id, texto}]
  const smAlternativas = useMemo(() => {
    if (tipo !== "selecao_multipla") return [];
    const alts = conteudo?.alternativas ?? [];
    return Array.isArray(alts) ? alts : [];
  }, [tipo, conteudo]);

  // bloco_rapido: array de itens
  const blocoRapidoItens = useMemo(() => {
    if (tipo !== "bloco_rapido") return [];
    if (!questao.blocoRapido) return [];
    const raw = typeof questao.blocoRapido === "string" ? JSON.parse(questao.blocoRapido) : questao.blocoRapido;
    return Array.isArray(raw) ? raw : [];
  }, [tipo, questao.blocoRapido]);

  // completar: conteudo.frases [{id, textoBase, correta}]
  const completarFrases = useMemo(() => {
    if (tipo !== "completar") return [];
    return Array.isArray(conteudo?.frases) ? conteudo.frases : [];
  }, [tipo, conteudo]);

  // completar_topo: conteudo.lacunas [{id, respostaCorreta}]
  const completarTopoLacunas = useMemo(() => {
    if (tipo !== "completar_topo") return [];
    return Array.isArray(conteudo?.lacunas) ? conteudo.lacunas : [];
  }, [tipo, conteudo]);

  // ligar_colunas: coluna A (gabarito) e coluna B vem embaralhada do Front/Aluno (guardaremos no _colunaB)
  const ligarColunasA = useMemo(() => {
    if (tipo !== "ligar_colunas") return [];
    const a = questao.ligarColunas ?? [];
    const parsed = typeof a === "string" ? JSON.parse(a) : a;
    return Array.isArray(parsed) ? parsed : [];
  }, [tipo, questao.ligarColunas]);

  // ====== Handlers ======
  async function onResponder() {
    try {
      setLoading(true);
      setResultado(null);

      if (tipo === "multipla_escolha" || tipo === "certa_errada") {
        if (!respLetra) return Alert.alert("Selecione uma alternativa");
        const data = await corrigirMultiplaEscolhaOuCertaErrada(questao.id, respLetra);
        setResultado(data);
        return;
      }

      if (tipo === "selecao_multipla") {
        const data = await corrigirSelecaoMultipla(questao.id, respSelecaoMultipla);
        setResultado(data);
        return;
      }

      if (tipo === "objetiva_curta") {
        const data = await corrigirObjetivaCurta(questao.id, respObjetivaCurta);
        setResultado(data);
        return;
      }

      if (tipo === "dissertativa") {
        const data = await corrigirDissertativa(questao.id, respDissertativa);
        setResultado(data);
        return;
      }

      if (tipo === "bloco_rapido") {
        // Garantir mesmo length da UI
        const pad = blocoRapidoItens.map((_: any, i: number) => String(respBlocoRapido[i] ?? ""));
        const data = await corrigirBlocoRapido(questao.id, pad);
        setResultado(data);
        return;
      }

      if (tipo === "ligar_colunas") {
        if (!Array.isArray(respLigar._colunaB) || respLigar._colunaB.length === 0) {
          return Alert.alert("Monte a coluna B (embaralhada) e os números da coluna A.");
        }
        const data = await corrigirLigarColunas(questao.id, respLigar);
        setResultado(data);
        return;
      }

      if (tipo === "completar") {
        const pad = completarFrases.map((_: any, i: number) => String(respCompletar[i] ?? ""));
        const data = await corrigirCompletar(questao.id, pad);
        setResultado(data);
        return;
      }

      if (tipo === "completar_topo") {
        const map = new Map<string, string>(respCompletarTopo.map(x => [x.lacunaId, x.valor]));
        const payload = completarTopoLacunas.map((l: any) => ({ lacunaId: l.id, valor: String(map.get(l.id) ?? "") }));
        const data = await corrigirCompletarTopo(questao.id, payload);
        setResultado(data);
        return;
      }

      Alert.alert("Tipo não suportado ainda", tipo);
    } catch (e: any) {
      console.error("[RESPONDER]", e);
      Alert.alert("Erro", e?.response?.data?.error ?? "Falha ao corrigir.");
    } finally {
      setLoading(false);
    }
  }

  // ====== UI por tipo ======
  function renderConteudo() {
    if (tipo === "multipla_escolha" || tipo === "certa_errada") {
      // Mostra alternativas A,B,C... (ou T/F). Seleciona 1.
      return (
        <View style={{ gap: 8 }}>
          {alternativas.map((txt, idx) => {
            const letra = letras[idx];
            const sel = respLetra === letra;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.optBtn, sel && styles.optBtnSel]}
                onPress={() => setRespLetra(letra)}
              >
                <Text style={styles.optLetter}>{letra})</Text>
                <Text style={styles.optText}>{String(txt)}</Text>
              </TouchableOpacity>
            );
          })}
          {isCertaErrada && alternativas.length === 0 && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["Certa", "Errada"].map((txt, i) => {
                const letra = i === 0 ? "C" : "E";
                const sel = respLetra === letra;
                return (
                  <TouchableOpacity key={txt} style={[styles.pill, sel && styles.pillSel]} onPress={() => setRespLetra(letra)}>
                    <Text style={[styles.pillText, sel && styles.pillTextSel]}>{txt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      );
    }

    if (tipo === "selecao_multipla") {
      return (
        <View style={{ gap: 8 }}>
          {smAlternativas.map((alt: any) => {
            const checked = respSelecaoMultipla.includes(String(alt.id));
            return (
              <TouchableOpacity
                key={String(alt.id)}
                style={[styles.optChk, checked && styles.optChkSel]}
                onPress={() => {
                  const id = String(alt.id);
                  setRespSelecaoMultipla((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                }}
              >
                <Text style={styles.optText}>{String(alt.texto ?? alt.id)}</Text>
                <Text style={{ opacity: 0.6 }}>{checked ? "✔" : ""}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (tipo === "objetiva_curta") {
      return (
        <TextInput
          value={respObjetivaCurta}
          onChangeText={setRespObjetivaCurta}
          placeholder="Digite sua resposta curta"
          style={styles.input}
          autoCapitalize="none"
        />
      );
    }

    if (tipo === "dissertativa") {
      return (
        <TextInput
          value={respDissertativa}
          onChangeText={setRespDissertativa}
          placeholder="Escreva sua resposta…"
          style={[styles.input, { height: 140, textAlignVertical: "top" }]}
          multiline
        />
      );
    }

    if (tipo === "bloco_rapido") {
      return (
        <View style={{ gap: 8 }}>
          {blocoRapidoItens.map((_: any, i: number) => (
            <TextInput
              key={i}
              value={respBlocoRapido[i] ?? ""}
              onChangeText={(t) => {
                const next = [...respBlocoRapido];
                next[i] = t;
                setRespBlocoRapido(next);
              }}
              placeholder={`Item ${i + 1}`}
              style={styles.input}
            />
          ))}
        </View>
      );
    }

    if (tipo === "completar") {
      // Entrada direta por lacuna (simples). Se quiser com “chips”, dá pra evoluir.
      return (
        <View style={{ gap: 8 }}>
          {completarFrases.map((fr: any, i: number) => (
            <View key={fr?.id ?? i} style={{ gap: 6 }}>
              <Text style={{ fontWeight: "600" }}>{String(fr?.textoBase ?? `Lacuna ${i + 1}`)}</Text>
              <TextInput
                value={respCompletar[i] ?? ""}
                onChangeText={(t) => {
                  const next = [...respCompletar];
                  next[i] = t;
                  setRespCompletar(next);
                }}
                placeholder={`Resposta ${i + 1}`}
                style={styles.input}
              />
            </View>
          ))}
        </View>
      );
    }

    if (tipo === "completar_topo") {
      return (
        <View style={{ gap: 8 }}>
          {completarTopoLacunas.map((l: any, i: number) => {
            const cur = respCompletarTopo.find((x) => x.lacunaId === l.id)?.valor ?? "";
            return (
              <View key={l.id} style={{ gap: 6 }}>
                <Text style={{ fontWeight: "600" }}>Lacuna {i + 1}</Text>
                <TextInput
                  value={cur}
                  onChangeText={(t) => {
                    setRespCompletarTopo((prev) => {
                      const idx = prev.findIndex((x) => x.lacunaId === l.id);
                      const next = [...prev];
                      if (idx === -1) next.push({ lacunaId: l.id, valor: t });
                      else next[idx] = { lacunaId: l.id, valor: t };
                      return next;
                    });
                  }}
                  placeholder={`Resposta ${i + 1}`}
                  style={styles.input}
                />
              </View>
            );
          })}
        </View>
      );
    }

    if (tipo === "ligar_colunas") {
      // UI simplificada: mostre a coluna A (linhas numeradas) e peça pro aluno
      // digitar o número da linha A correspondente a cada item da coluna B.
      // Precisamos também do _colunaB (embaralhada) — aqui, como demo, usaremos a PRÓPRIA A embaralhada localmente
      // até você passar a colunaB do seu componente.
      // Dica: quando vier do seu componente, faça setRespLigar({_colunaB: colunaB, "0": "3", "1": "1", ...})
      const colunaA = ligarColunasA;
      // Embaralhar rapidamente A para simular uma B
      const colB = useMemo(() => {
        if (!respLigar._colunaB || respLigar._colunaB.length === 0) {
          const arr = [...colunaA];
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
        }
        return Array.isArray(respLigar._colunaB) ? respLigar._colunaB : [];
      }, [respLigar._colunaB, colunaA]);

      return (
        <View style={{ gap: 12 }}>
          <Text style={{ fontWeight: "700" }}>Coluna A (referência)</Text>
          {colunaA.map((a: any, i: number) => (
            <Text key={`A-${i}`}>{`${i + 1}) ${a.ladoB}`}</Text>
          ))}

          <Text style={{ fontWeight: "700", marginTop: 8 }}>Coluna B (embaralhada)</Text>
          {colB.map((b: any, i: number) => (
            <View key={`B-${i}`} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ width: 22, textAlign: "right" }}>{i + 1})</Text>
              <Text style={{ flex: 1 }}>{String(b.ladoB)}</Text>
              <TextInput
                style={[styles.input, { width: 64 }]}
                placeholder="A#"
                keyboardType="number-pad"
                onChangeText={(t) => {
                  setRespLigar((prev) => ({
                    ...prev,
                    _colunaB: colB,
                    [String(i)]: t,
                  }));
                }}
              />
            </View>
          ))}
        </View>
      );
    }

    return <Text style={{ opacity: 0.6 }}>Tipo ainda não suportado nesta tela.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.code}>{questao.codigo}</Text>
      <Text style={styles.enunciado}>{questao.enunciado}</Text>

      <View style={{ height: 12 }} />

      {renderConteudo()}

      <View style={{ height: 16 }} />

      <TouchableOpacity style={styles.btn} disabled={loading} onPress={onResponder}>
        {loading ? <ActivityIndicator /> : <Text style={styles.btnText}>Responder</Text>}
      </TouchableOpacity>

      {resultado && (
        <View style={styles.resultBox}>
          {"nota" in resultado ? (
            <>
              <Text style={styles.resultTitle}>Nota: {resultado.nota?.toFixed?.(1) ?? resultado.nota}</Text>
              {!!resultado.justificativa && <Text style={styles.resultText}>{resultado.justificativa}</Text>}
              {!!resultado.sugestao && <Text style={[styles.resultText, { opacity: 0.7 }]}>Sugestão: {resultado.sugestao}</Text>}
            </>
          ) : (
            <>
              {"acertou" in resultado && (
                <Text style={[styles.resultTitle, { color: resultado.acertou ? "#059669" : "#DC2626" }]}>
                  {resultado.acertou ? "Acertou!" : "Ainda não…"}
                </Text>
              )}
              <Text style={[styles.resultText, { opacity: 0.7 }]}>{JSON.stringify(resultado)}</Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  code: { fontWeight: "800", color: "#111", marginBottom: 6 },
  enunciado: { color: "#111", fontSize: 16 },
  input: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff",
  },
  btn: { backgroundColor: "#111", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },

  optBtn: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  optBtnSel: { borderColor: "#111", backgroundColor: "#1111110A" },
  optLetter: { fontWeight: "800", width: 22 },
  optText: { flex: 1, color: "#111" },

  optChk: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  optChkSel: { borderColor: "#111" },

  pill: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillSel: { borderColor: "#111", backgroundColor: "#1111110A" },
  pillText: { color: "#111" },
  pillTextSel: { fontWeight: "700" },

  resultBox: { marginTop: 16, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 12, backgroundColor: "#fff" },
  resultTitle: { fontWeight: "800", fontSize: 16, marginBottom: 6 },
  resultText: { color: "#111" },
});
