# Guia — Rebuild com Notificações Push

## Status Atual

### Android ✅
- Firebase configurado (projeto "Genius Factory", Plano Blaze)
- App Android registrado: `com.geniusfactory.app`
- `google-services.json` na raiz do projeto
- Build de desenvolvimento em andamento: `eas build --profile development --platform android`

### iOS ⬜ (pendente)
- Não usa Firebase — usa APNs (Apple Push Notification service)
- Precisa de APNs Key (.p8) + build nativo

---

## Passo a passo — Build iOS com Push Notifications

### 1. Criar a APNs Key

1. Acesse [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**
2. Menu lateral: **Keys** → **Create a Key** (+)
3. Dê um nome (ex: "Genius Factory Push")
4. Marque **Apple Push Notifications service (APNs)**
5. Clique **Continue** → **Register**
6. **Baixe o arquivo `.p8`** — ⚠️ só pode baixar UMA VEZ!
7. Anote o **Key ID** (exibido na tela)
8. Guarde o arquivo `.p8` em local seguro

### 2. Upload da APNs Key via EAS

```bash
eas credentials --platform ios
```

- Selecione o projeto
- Escolha **Push Notifications: Manage your Apple Push Notifications Key**
- Faça upload do arquivo `.p8` baixado no passo anterior
- Informe o **Key ID** e o **Team ID** (encontrado em developer.apple.com → Membership)

### 3. Build iOS

```bash
eas build --profile development --platform ios
```

O build será feito nos servidores do EAS (~15-20 min) e incluirá `expo-notifications` e `expo-device` compilados nativamente.

### 4. Instalar e testar

- Instale o build no dispositivo iOS (via TestFlight ou link direto do EAS)
- O app vai pedir permissão de push na primeira abertura
- O console deve mostrar logs `[Notificacoes]` sem erros

---

## Notas

- **Uma APNs Key serve para todos os apps** da mesma Apple Developer Account
- **A APNs Key não expira**, diferente dos certificados push antigos (.p12)
- **O Expo Push Service** cuida do roteamento: detecta a plataforma e envia via FCM (Android) ou APNs (iOS) automaticamente
- **Não é preciso adicionar app iOS no Firebase** — o Firebase só é usado para Android
