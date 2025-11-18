import { useAlunoHeader } from '@/src/hooks/useAlunoHeader';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import { Award, Gauge, LogOut, Trophy, User } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearSession, sessionAtom } from '../../src/state/session';

const diamondImage = require('../../assets/images/diamante.webp');

const MENU_ITEMS = [
  { key: 'performance', label: 'Performance', Icon: Gauge, route: '/(app)/performance' },
  { key: 'conquistas', label: 'Conquistas', Icon: Award, route: '/(app)/conquistas' },
  { key: 'ranking', label: 'Ranking', Icon: Trophy, route: '/(app)/ranking' },
  { key: 'minha-conta', label: 'Minha Conta', Icon: User, route: '/(app)/minha-conta' },
  { key: 'sair', label: 'Sair', Icon: LogOut },
];

export default function MenuScreen() {
  const router = useRouter();
  const setSession = useSetAtom(sessionAtom);
  const { data, loading } = useAlunoHeader();
  const [loggingOut, setLoggingOut] = useState(false);

  const studentName = useMemo(() => {
    if (!data?.nome || data.nome.trim() === '') return 'Aluno';
    return data.nome;
  }, [data?.nome]);

  const geniusCoins = useMemo(() => {
    if (loading) return 'Carregando...';
    if (data?.geniusCoins !== undefined) {
      return data.geniusCoins.toLocaleString('pt-BR');
    }
    return '--';
  }, [data?.geniusCoins, loading]);

  async function handleLogout() {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);
              
              // 1. Limpa o SecureStore
              await clearSession();
              
              // 2. Limpa o estado do Jotai
              setSession(null);
              
              // 3. Redireciona para login
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }

  function handleMenuPress(key: string, route?: string) {
    if (key === 'sair') {
      handleLogout();
      return;
    }
    
    if (route) {
      router.push(route as any);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerWrapper}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              {data?.avatarUrl ? (
                <Image source={{ uri: data.avatarUrl }} style={styles.avatarImage} resizeMode="contain" />
              ) : (
                <Ionicons name="person" size={36} color="#FFFFFF" />
              )}
            </View>
          </View>

          <LinearGradient
            colors={['#7A34FF', '#FF5FDB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          />
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.bannerName}>{studentName}</Text>
          <View style={styles.bannerCoinsRow}>
            <Image source={diamondImage} style={styles.bannerDiamond} resizeMode="contain" />
            <Text style={styles.bannerCoins}>{geniusCoins}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {MENU_ITEMS.map(({ key, label, Icon, route }) => (
            <TouchableOpacity
              key={key}
              style={styles.menuItem}
              activeOpacity={0.8}
              disabled={loggingOut}
              onPress={() => handleMenuPress(key, route)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  {loggingOut && key === 'sair' ? (
                    <ActivityIndicator size="small" color="#9CA3AF" />
                  ) : (
                    <Icon size={20} color="#9CA3AF" strokeWidth={2} />
                  )}
                </View>
                <Text style={styles.menuLabel}>{label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#F43F5E" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  bannerWrapper: {
    marginHorizontal: 20,
    marginTop: 20,
    position: 'relative',
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 9,
    elevation: 6,
    minHeight: 100,
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'absolute',
    top: 40,
    left: '50%',
    transform: [{ translateX: -48 }],
    zIndex: 2,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FCD34D',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 6,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 35.5,
  },
  profileInfo: {
    marginTop: 48,
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerName: {
    fontSize: 20,
    color: '#1A1A1A',
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  bannerCoinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerDiamond: {
    width: 24,
    height: 24,
  },
  bannerCoins: {
    fontSize: 15,
    color: '#7A34FF',
    fontFamily: 'Inter-SemiBold',
  },
  menuContainer: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontFamily: 'Inter-Medium',
  },
});