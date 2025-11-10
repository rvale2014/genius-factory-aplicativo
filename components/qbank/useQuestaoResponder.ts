// hooks/useQuestaoResponder.ts
import type { QuestaoDetalhe } from "@/src/services/questoesService";
import * as respostas from "@/src/services/respostasService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useState } from "react";

const KEY = (id: string) => `gf_q_${id}_rascunho`;

export function useQuestaoResponder() {
  const [loading, setLoading] = useState(false);
  const lastFeedbackRef = useRef<{
    status: "ok" | "erro";
    acertou?: boolean;
    nota?: number;
    msg?: string;
  } | null>(null);

  async function persistRascunho(id: string, snapshot: any) {
    try {
      await AsyncStorage.setItem(KEY(id), JSON.stringify(snapshot));
    } catch {}
  }

  async function limparRascunho(id: string) {
    try {
      await AsyncStorage.removeItem(KEY(id));
    } catch {}
  }

  async function enviar(questao: QuestaoDetalhe, snapshot: any) {
    setLoading(true);
    await persistRascunho(questao.id, snapshot);

    try {
      let resp: any;

      switch (questao.tipo) {
        case "multipla_escolha":
        case "certa_errada": {
          const letra = snapshot?.letra ?? "";
          resp = await respostas.corrigirMultiplaEscolhaOuCertaErrada(
            questao.id,
            letra
          );
          lastFeedbackRef.current = { status: "ok", acertou: !!resp?.acertou };
          break;
        }

        case "objetiva_curta": {
          const texto = snapshot?.texto ?? "";
          resp = await respostas.corrigirObjetivaCurta(questao.id, texto);
          lastFeedbackRef.current = { status: "ok", acertou: !!resp?.acertou };
          break;
        }

        case "dissertativa": {
          const texto = snapshot?.texto ?? "";
          resp = await respostas.corrigirDissertativa(questao.id, texto);
          lastFeedbackRef.current = {
            status: "ok",
            nota: Number(resp?.nota) || 0,
            acertou: !!resp?.acertou,
          };
          break;
        }

        case "ligar_colunas": {
          // Mantém a estrutura {_colunaB, ...respostas}
          const respostasAluno = {
            _colunaB: snapshot?._colunaB,
            ...snapshot?.respostas,
          };
          resp = await respostas.corrigirLigarColunas(
            questao.id,
            respostasAluno
          );
          lastFeedbackRef.current = { status: "ok", acertou: !!resp?.acertou };
          break;
        }

        case "bloco_rapido": {
          const itens: string[] = snapshot?.itens ?? [];
          resp = await respostas.corrigirBlocoRapido(questao.id, itens);
          lastFeedbackRef.current = { status: "ok", acertou: !!resp?.acertou };
          break;
        }

        case "completar": {
          const itens: string[] = snapshot?.itens ?? [];
          resp = await respostas.corrigirCompletar(questao.id, itens);
          lastFeedbackRef.current = { status: "ok", acertou: !!resp?.acertou };
          break;
        }

        case "completar_topo": {
          const respostasAluno =
            snapshot?.respostasAluno ?? snapshot?.itens ?? [];
          resp = await respostas.corrigirCompletarTopo(
            questao.id,
            respostasAluno
          );
          lastFeedbackRef.current = { status: "ok", acertou: !!resp?.acertou };
          break;
        }

        case "tabela": {
          // Você adicionou corrigirTabela(questaoId, resposta:any)
          // Enviamos o snapshot inteiro (defensivo), pois o subtipo/estrutura
          // pode variar (ex.: cruzadinha, math_table etc.)
          resp = await respostas.corrigirTabela(questao.id, snapshot ?? {});
          lastFeedbackRef.current = { status: "ok", acertou: !!resp?.acertou };
          break;
        }

        case "colorir_figura": {
          // Você adicionou corrigirColorirFigura(questaoId, partesMarcadas: string[])
          const partes: string[] =
            snapshot?.partesMarcadas ??
            snapshot?.partes ??
            snapshot?.selecionados ??
            [];
          resp = await respostas.corrigirColorirFigura(questao.id, partes);
          lastFeedbackRef.current = { status: "ok", acertou: !!resp?.acertou };
          break;
        }

        default: {
          throw new Error(`Tipo não suportado: ${questao.tipo}`);
        }
      }

      await limparRascunho(questao.id);
    } catch (e: any) {
      lastFeedbackRef.current = {
        status: "erro",
        msg: "Falha ao enviar resposta.",
      };
      // mantém rascunho
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    enviar,
    lastFeedback: lastFeedbackRef.current ?? undefined,
  };
}

