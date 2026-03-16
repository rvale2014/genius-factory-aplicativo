// src/state/notificacoes.ts
import { atom } from 'jotai';

/** Contagem de notificações não lidas — usado para badge no sininho */
export const notificacoesNaoLidasAtom = atom(0);
