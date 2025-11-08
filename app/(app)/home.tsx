import { listarTrilhas } from '@/src/services/trilhasService';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, Text, View } from 'react-native';
import { api } from '../../src/lib/api';
import { clearSession, sessionAtom } from '../../src/state/session';

type Resp = { endpoint: string; status: number; data: any };

export default function Home() {
  const [session, setSession] = useAtom(sessionAtom);
  const [resp, setResp] = useState<Resp | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function call(endpoint: string) {
    setResp(null); setErro(null); setLoading(true);
    try {
      const res = await api.get(endpoint);
      setResp({ endpoint, status: res.status, data: res.data });
    } catch (e: any) {
      const msg = e?.response
        ? `HTTP ${e.response.status} (${endpoint})`
        : String(e?.message ?? e);
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  async function doPingPublico() {
    await call('/mobile/v1/ping');
  }

  async function doPingProtegido() {
    await call('/mobile/v1/trilhas');
    // ou, com service + Zod:
    setLoading(true); setErro(null); setResp(null);
    try {
      const data = await listarTrilhas();
      setResp({ endpoint: '/mobile/v1/trilhas', status: 200, data });
    } catch (e: any) { 
      setErro('Erro ao carregar trilhas'); 
    } finally { 
      setLoading(false); 
    }
  }

  async function handleLogout() {
    await clearSession();
    setSession(null);
    router.replace('/(auth)/login');
  }

  useEffect(() => { doPingPublico(); }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Sessão</Text>
      <Text selectable>
        {session ? 'Logado (tokens presentes)' : 'Deslogado (sem tokens)'}
      </Text>

      <View style={{ height: 16 }} />

      <Text style={{ fontSize: 18, fontWeight: '700' }}>Testes de API</Text>
      <Button title="Ping público → /ping" onPress={doPingPublico} />
      <Button title="Ping protegido → /trilhas" onPress={doPingProtegido} />

      <View style={{ height: 16 }} />

      <Button title="Logout" color="#b00020" onPress={handleLogout} />

      <View style={{ height: 16 }} />

      {loading && <ActivityIndicator />}

      {!loading && erro && (
        <Text selectable style={{ color: '#b00020' }}>
          Erro: {erro}
        </Text>
      )}

      {!loading && resp && (
        <>
          <Text selectable style={{ fontWeight: '700' }}>
            {`Endpoint: ${resp.endpoint} | HTTP ${resp.status}`}
          </Text>
          <Text selectable>{JSON.stringify(resp.data, null, 2)}</Text>
        </>
      )}
    </ScrollView>
  );
}
