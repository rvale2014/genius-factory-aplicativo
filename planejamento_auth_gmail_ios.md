# Planejamento — Login Social (Google + Apple)

## Contexto

O app mobile da Genius Factory é usado apenas por quem já tem assinatura. A criação de conta acontece na **versão web**. O app funciona como portal de login para contas existentes.

Atualmente, tanto a web quanto o app suportam apenas login com **email/senha**. A web já tem Sign in with Google implementado para criação de conta.

## Objetivo

Permitir login social no app e garantir que contas criadas com Apple na web funcionem no iOS.

## Escopo

### Etapa 1 — Backend/Web: Sign in with Apple

- Adicionar Apple Provider ao sistema de auth existente (NextAuth/Auth.js)
- Permitir **criação de conta com Apple** na web (ao lado do Google que já existe)
- Configurar Apple Developer: Service ID, chave `.p8`, domínio verificado
- Gerar `clientSecret` (JWT assinado com chave privada Apple, renovação a cada 6 meses)

### Etapa 2 — App Mobile: Login com Google (Android + iOS)

- Implementar Google Sign-in no app usando `expo-auth-session` ou `@react-native-google-signin`
- Funciona em **ambas as plataformas**
- Reutiliza a infra Google que já existe no backend

### Etapa 3 — App Mobile: Login com Apple (iOS only)

- Implementar Sign in with Apple usando `expo-apple-authentication`
- Renderizar botão **apenas no iOS** (`Platform.OS === 'ios'`)
- Usa SDK nativo da Apple (autenticação biométrica, botão padrão Apple)

## Tela de Login — Resultado Final

**iOS:**
```
[ 🍎 Continuar com Apple  ]
[ 🔵 Continuar com Google ]
──────── ou ────────
[ Email e senha           ]
```

**Android:**
```
[ 🔵 Continuar com Google ]
──────── ou ────────
[ Email e senha           ]
```

## Decisões Alinhadas

1. **Contas com mesmo email são vinculadas automaticamente** — se o usuário criou conta com email/senha e depois tenta logar com Google (mesmo email), o backend reconhece como a mesma conta
2. **Sign in with Apple não é oferecido no Android** — a maioria dos usuários Android não tem Apple ID, e a Play Store não exige
3. **A ordem de implementação é: backend primeiro → Google no app → Apple no app** — o app depende do backend para autenticar

## Regra da App Store (Apple)

Se o app iOS oferece login social (Google), a Apple **exige** que Sign in with Apple também seja oferecido. Por isso a Etapa 3 é obrigatória antes de publicar na App Store.

## Dependências

| Etapa | Repositório | Dependências |
|-------|------------|-------------|
| 1 | genius-factory (web) | Apple Developer Account, Service ID, chave `.p8` |
| 2 | genius-factory-aplicativo | `expo-auth-session` ou `@react-native-google-signin`, Google OAuth Client ID |
| 3 | genius-factory-aplicativo | `expo-apple-authentication`, Apple Developer Account |

## Status

- [ ] Etapa 1: Backend — Sign in with Apple na web
- [ ] Etapa 2: App — Login com Google (Android + iOS)
- [ ] Etapa 3: App — Login com Apple (iOS only)
