# Configuração de Deep Linking - Redefinição de Senha

## Como Funciona

O app está configurado para receber deep links no formato:
```
geniusfactory://nova-senha?token=TOKEN_AQUI
```

Quando o usuário clica no link do e-mail, o sistema operacional abre o app diretamente na tela de redefinição de senha.

## Formato do Link que o Backend deve Enviar

O backend deve enviar no e-mail um link no seguinte formato:

### Opção 1: Scheme-based (Recomendado para desenvolvimento)
```
geniusfactory://nova-senha?token=abc123xyz
```

### Opção 2: Universal Links / App Links (Recomendado para produção)
Se você tiver um domínio próprio, pode usar:
```
https://seudominio.com/reset-password?token=abc123xyz
```

## Implementação no Backend

No endpoint `POST /mobile/v1/auth/reset-password`, o backend deve gerar um link como:

### Exemplo de resposta do e-mail (HTML):
```html
<a href="geniusfactory://nova-senha?token={{token}}">
  Clique aqui para redefinir sua senha
</a>
```

### Exemplo em texto plano:
```
Clique no link para redefinir sua senha:
geniusfactory://nova-senha?token={{token}}
```

## Como Testar Localmente

### 1. Testar no iOS Simulator
```bash
xcrun simctl openurl booted "geniusfactory://nova-senha?token=teste123"
```

### 2. Testar no Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "geniusfactory://nova-senha?token=teste123" com.geniusfactory.app
```

### 3. Testar no dispositivo físico (iOS)
- Abra o Safari no iPhone
- Digite na barra de endereço: `geniusfactory://nova-senha?token=teste123`
- Pressione Enter

### 4. Testar no dispositivo físico (Android)
- Abra o Chrome no Android
- Digite na barra de endereço: `geniusfactory://nova-senha?token=teste123`
- Pressione Enter

## Fluxo Completo

1. Usuário solicita redefinição de senha
2. Backend gera token e envia e-mail com link
3. Usuário clica no link do e-mail
4. Sistema operacional abre o app
5. App navega para `/(auth)/nova-senha?token=...`
6. Tela de nova senha recebe o token via `useLocalSearchParams`
7. Usuário define nova senha
8. App chama `POST /mobile/v1/auth/reset-password/confirm` com token e senha

## Notas Importantes

- O scheme `geniusfactory://` foi configurado no `app.config.ts`
- O Expo Router automaticamente mapeia rotas para deep links
- A tela `nova-senha.tsx` já está preparada para receber o token
- Após definir a senha, o usuário é redirecionado para o login

## Troubleshooting

### O link não abre o app
- Verifique se o app está instalado
- Certifique-se de que o scheme está correto: `geniusfactory://`
- Reinstale o app após mudanças no `app.config.ts`

### O app abre mas não navega para a tela correta
- Verifique se a rota `/(auth)/nova-senha` existe
- Verifique se o token está sendo passado corretamente na URL
- Confira os logs do app para erros de navegação

