# Exemplo de Implementação no Backend

## Endpoint: POST /mobile/v1/auth/reset-password

### Request Body
```json
{
  "email": "aluno@exemplo.com"
}
```

### Implementação Sugerida (Node.js/Express exemplo)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/mobile/v1/auth/reset-password', async (req, res) => {
  const { email } = req.body;

  // 1. Validar se o e-mail existe
  const aluno = await Aluno.findOne({ where: { email } });
  if (!aluno) {
    return res.status(404).json({ error: 'E-mail não encontrado' });
  }

  // 2. Gerar token de redefinição (exemplo com JWT ou token aleatório)
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // 3. Salvar token no banco (com expiração, ex: 1 hora)
  await PasswordResetToken.create({
    token: resetToken,
    alunoId: aluno.id,
    expiresAt: new Date(Date.now() + 3600000), // 1 hora
  });

  // 4. Criar o link de deep link
  const resetLink = `geniusfactory://nova-senha?token=${resetToken}`;

  // 5. Enviar e-mail usando Resend
  try {
    await resend.emails.send({
      from: 'Genius Factory <noreply@seudominio.com>',
      to: email,
      subject: 'Redefinição de Senha - Genius Factory',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #14b8a6; 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 20px 0;
              }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Redefinição de Senha</h2>
              <p>Olá,</p>
              <p>Você solicitou a redefinição de senha para sua conta Genius Factory.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <a href="${resetLink}" class="button">Redefinir Senha</a>
              <p>Ou copie e cole o link abaixo no seu navegador:</p>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${resetLink}</p>
              <p>Este link expira em 1 hora.</p>
              <p>Se você não solicitou esta redefinição, ignore este e-mail.</p>
              <div class="footer">
                <p>Atenciosamente,<br>Equipe Genius Factory</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Redefinição de Senha - Genius Factory
        
        Olá,
        
        Você solicitou a redefinição de senha para sua conta Genius Factory.
        
        Clique no link abaixo para criar uma nova senha:
        ${resetLink}
        
        Este link expira em 1 hora.
        
        Se você não solicitou esta redefinição, ignore este e-mail.
        
        Atenciosamente,
        Equipe Genius Factory
      `,
    });

    res.json({ 
      message: 'E-mail de redefinição enviado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ error: 'Erro ao enviar e-mail' });
  }
});
```

## Endpoint: POST /mobile/v1/auth/reset-password/confirm

### Request Body
```json
{
  "token": "abc123xyz...",
  "senha": "novaSenha123"
}
```

### Implementação Sugerida

```typescript
app.post('/mobile/v1/auth/reset-password/confirm', async (req, res) => {
  const { token, senha } = req.body;

  // 1. Buscar token no banco
  const resetToken = await PasswordResetToken.findOne({
    where: { 
      token,
      expiresAt: { [Op.gt]: new Date() }, // Token não expirado
    },
    include: [{ model: Aluno }],
  });

  if (!resetToken) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  // 2. Validar senha (exemplo: mínimo 6 caracteres)
  if (senha.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
  }

  // 3. Hash da nova senha
  const hashedPassword = await bcrypt.hash(senha, 10);

  // 4. Atualizar senha do aluno
  await resetToken.aluno.update({ senha: hashedPassword });

  // 5. Invalidar o token (deletar ou marcar como usado)
  await resetToken.destroy();

  res.json({ 
    message: 'Senha redefinida com sucesso' 
  });
});
```

## Estrutura do Banco de Dados (Exemplo)

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  aluno_id UUID NOT NULL REFERENCES alunos(id),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);
```

## Variáveis de Ambiente Necessárias

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## Notas Importantes

1. **Token de Segurança**: Gere tokens únicos e aleatórios (não use IDs sequenciais)
2. **Expiração**: Tokens devem expirar (recomendado: 1 hora)
3. **Uso Único**: Token deve ser invalidado após uso
4. **Rate Limiting**: Implemente limite de requisições para evitar spam
5. **Validação**: Valide o formato do e-mail antes de processar

