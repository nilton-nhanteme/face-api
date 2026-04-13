# Configuração de Permissões IAM para Face Liveness

Este guia explica como adicionar as permissões necessárias para usar o recurso de Face Liveness do AWS Rekognition.

## 📋 Visão Geral

Para implementar o Face Liveness, você precisa configurar permissões em dois lugares:

1. **Backend (Node.js)**: Usuário IAM que a API usa
2. **Frontend (Cognito)**: Identity Pool do Cognito para usuários autenticados

---

## 🔧 1. Permissões para o Backend (Usuário IAM)

### Permissões Necessárias

O usuário IAM que sua API usa precisa das seguintes permissões:

- `rekognition:CreateFaceLivenessSession` - Criar sessões de liveness
- `rekognition:GetFaceLivenessSessionResults` - Obter resultados das sessões

### Opção A: Adicionar via Console AWS

1. Acesse o [Console IAM da AWS](https://console.aws.amazon.com/iam/)
2. Vá em **Users** (Usuários)
3. Encontre o usuário IAM que você usa no backend (cujas credenciais estão no `.env`)
4. Clique na aba **Permissions** (Permissões)
5. Clique em **Add permissions** > **Create inline policy**
6. Selecione a aba **JSON** e cole o conteúdo do arquivo `iam-policy-backend.json`
7. Clique em **Review policy**
8. Dê um nome como `RekognitionFaceLivenessPolicy`
9. Clique em **Create policy**

### Opção B: Adicionar via AWS CLI

```bash
# Substitua YOUR_IAM_USERNAME pelo nome do seu usuário IAM
aws iam put-user-policy \
  --user-name YOUR_IAM_USERNAME \
  --policy-name RekognitionFaceLivenessPolicy \
  --policy-document file://iam-policy-backend.json
```

### Verificar Permissões Atuais

Para ver as políticas atuais do usuário:

```bash
aws iam list-user-policies --user-name YOUR_IAM_USERNAME
aws iam list-attached-user-policies --user-name YOUR_IAM_USERNAME
```

---

## 🌐 2. Permissões para o Frontend (Cognito Identity Pool)

### Permissões Necessárias

Os usuários autenticados via Cognito precisam da permissão:

- `rekognition:StartFaceLivenessSession` - Iniciar sessões de liveness

### Opção A: Adicionar via Console AWS

1. Acesse o [Console do Cognito](https://console.aws.amazon.com/cognito/)
2. Vá em **Identity pools** (Federated Identities)
3. Selecione seu Identity Pool
4. Clique em **Edit identity pool**
5. Expanda **Authentication providers**
6. Encontre a **IAM Role** para usuários autenticados (geralmente termina com `_Auth_Role`)
7. Clique no link da Role para abrir no console IAM
8. Na página da Role, clique em **Add permissions** > **Create inline policy**
9. Selecione a aba **JSON** e cole o conteúdo do arquivo `iam-policy-cognito.json`
10. Clique em **Review policy**
11. Dê um nome como `RekognitionFaceLivenessFrontendPolicy`
12. Clique em **Create policy**

### Opção B: Adicionar via AWS CLI

```bash
# Primeiro, encontre o nome da Role do Cognito
aws cognito-identity get-identity-pool-roles --identity-pool-id YOUR_IDENTITY_POOL_ID

# Substitua YOUR_COGNITO_AUTH_ROLE pelo nome da role retornada acima
aws iam put-role-policy \
  --role-name YOUR_COGNITO_AUTH_ROLE \
  --policy-name RekognitionFaceLivenessFrontendPolicy \
  --policy-document file://iam-policy-cognito.json
```

---

## 🔍 3. Verificação das Permissões

### Testar Permissões do Backend

Após adicionar as permissões, você pode testar criando uma sessão:

```javascript
// No seu código Node.js
const { RekognitionClient, CreateFaceLivenessSessionCommand } = require('@aws-sdk/client-rekognition');

const client = new RekognitionClient({ region: 'us-east-1' });
const command = new CreateFaceLivenessSessionCommand({});

try {
  const response = await client.send(command);
  console.log('✅ Permissões OK:', response.SessionId);
} catch (error) {
  console.error('❌ Erro de permissão:', error.message);
}
```

### Testar Permissões do Frontend

No frontend, após configurar o Cognito:

```typescript
// No seu código Angular/TypeScript
import { RekognitionClient, StartFaceLivenessSessionCommand } from '@aws-sdk/client-rekognition';

const client = new RekognitionClient({
  region: 'us-east-1',
  credentials: fromCognitoIdentityPool({
    // suas credenciais do Cognito
  })
});

const command = new StartFaceLivenessSessionCommand({ SessionId: 'session-id-aqui' });

try {
  const response = await client.send(command);
  console.log('✅ Permissões OK');
} catch (error) {
  console.error('❌ Erro de permissão:', error.message);
}
```

---

## ⚠️ Notas Importantes

### Segurança

1. **Princípio do Menor Privilégio**: As políticas fornecidas incluem apenas as permissões necessárias
2. **Resource Restrictions**: Considere restringir o `Resource` de `"*"` para ARNs específicos se possível
3. **Credenciais**: Nunca commite credenciais no código. Use variáveis de ambiente (`.env`)

### Custos

- O Face Liveness tem custos por sessão criada
- Consulte a [página de preços do Rekognition](https://aws.amazon.com/rekognition/pricing/)

### Regiões

- Verifique se o Face Liveness está disponível na sua região AWS
- Nem todas as regiões suportam todos os recursos do Rekognition

---

## 📚 Recursos Adicionais

- [Documentação do Face Liveness](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Cognito Identity Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools.html)

---

## 🆘 Troubleshooting

### Erro: "AccessDeniedException"

- Verifique se as permissões foram aplicadas corretamente
- Aguarde alguns minutos para propagação das políticas
- Confirme que está usando as credenciais corretas

### Erro: "InvalidParameterException"

- Verifique se a região suporta Face Liveness
- Confirme que os parâmetros da sessão estão corretos

### Erro: "ThrottlingException"

- Você atingiu o limite de requisições
- Implemente retry com backoff exponencial
