# ✅ Permissões Configuradas com Sucesso

## 📋 Resumo da Configuração

Todas as permissões necessárias para o Face Liveness foram configuradas com sucesso!

---

## 🔐 Backend - Usuário IAM

### Informações do Usuário
- **Nome do Usuário**: `hjonas`
- **ARN**: `arn:aws:iam::629205655921:user/hjonas`
- **Account ID**: `629205655921`

### Política Aplicada
- **Nome da Política**: `RekognitionFaceLivenessPolicy`
- **Tipo**: Inline Policy

### Permissões Configuradas

#### 1. Face Liveness (Novas Permissões)
```json
{
  "Sid": "RekognitionFaceLivenessBackend",
  "Effect": "Allow",
  "Action": [
    "rekognition:CreateFaceLivenessSession",
    "rekognition:GetFaceLivenessSessionResults"
  ],
  "Resource": "*"
}
```

#### 2. Rekognition Existentes
```json
{
  "Sid": "RekognitionExistingPermissions",
  "Effect": "Allow",
  "Action": [
    "rekognition:DetectFaces",
    "rekognition:CompareFaces",
    "rekognition:IndexFaces",
    "rekognition:SearchFacesByImage",
    "rekognition:CreateCollection",
    "rekognition:ListCollections",
    "rekognition:DescribeCollection"
  ],
  "Resource": "*"
}
```

#### 3. S3 Permissions
```json
{
  "Sid": "S3Permissions",
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::rekogn-images-collection",
    "arn:aws:s3:::rekogn-images-collection/*"
  ]
}
```

---

## 🌐 Frontend - Cognito Identity Pool

### Informações do Identity Pool
- **Nome**: `LivenessPool`
- **ID**: `sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa`
- **Região**: `sa-east-1` (São Paulo)

### IAM Role para Usuários Não Autenticados
- **Nome da Role**: `LivenessPool_Unauth_Role`
- **ARN**: `arn:aws:iam::629205655921:role/LivenessPool_Unauth_Role`

### Permissões Configuradas
```json
{
  "Sid": "RekognitionFaceLivenessFrontend",
  "Effect": "Allow",
  "Action": [
    "rekognition:StartFaceLivenessSession"
  ],
  "Resource": "*"
}
```

---

## 🔄 Fluxo Completo de Permissões

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular)                       │
│                                                             │
│  Cognito Identity Pool (Usuários Não Autenticados)         │
│  Role: LivenessPool_Unauth_Role                             │
│                                                             │
│  ✅ rekognition:StartFaceLivenessSession                    │
│     └─ Inicia a sessão de liveness no frontend             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP Requests
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js/Express)                 │
│                                                             │
│  Usuário IAM: hjonas                                        │
│  Credenciais: ACCESS_KEY_ID / SECRET_ACCESS_KEY             │
│                                                             │
│  ✅ rekognition:CreateFaceLivenessSession                   │
│     └─ Cria uma nova sessão e retorna sessionId            │
│                                                             │
│  ✅ rekognition:GetFaceLivenessSessionResults               │
│     └─ Obtém os resultados da verificação                  │
│                                                             │
│  ✅ rekognition:DetectFaces                                 │
│  ✅ rekognition:CompareFaces                                │
│  ✅ rekognition:IndexFaces                                  │
│  ✅ rekognition:SearchFacesByImage                          │
│  ✅ rekognition:CreateCollection                            │
│  ✅ rekognition:ListCollections                             │
│  ✅ rekognition:DescribeCollection                          │
│                                                             │
│  ✅ s3:PutObject                                            │
│  ✅ s3:GetObject                                            │
│  ✅ s3:ListBucket                                           │
│     └─ Bucket: rekogn-images-collection                    │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Configuração

### Backend
- [x] Usuário IAM identificado (`hjonas`)
- [x] Política `RekognitionFaceLivenessPolicy` criada
- [x] Permissão `CreateFaceLivenessSession` adicionada
- [x] Permissão `GetFaceLivenessSessionResults` adicionada
- [x] Permissões existentes do Rekognition incluídas
- [x] Permissões do S3 incluídas
- [x] Política anexada ao usuário

### Frontend
- [x] Identity Pool criado (`LivenessPool`)
- [x] IAM Role para não autenticados criada
- [x] Permissão `StartFaceLivenessSession` adicionada
- [x] Role associada ao Identity Pool
- [x] Configurações adicionadas ao `.env`

---

## 🧪 Testar as Permissões

### Teste 1: Backend - Criar Sessão de Liveness

```javascript
// src/server.ts ou arquivo de teste
import { RekognitionClient, CreateFaceLivenessSessionCommand } from '@aws-sdk/client-rekognition';

const client = new RekognitionClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  }
});

async function testCreateSession() {
  try {
    const command = new CreateFaceLivenessSessionCommand({
      Settings: {
        OutputConfig: {
          S3Bucket: 'rekogn-images-collection',
          S3KeyPrefix: 'liveness-sessions/'
        }
      }
    });
    
    const response = await client.send(command);
    console.log('✅ Sessão criada com sucesso!');
    console.log('SessionId:', response.SessionId);
    return response.SessionId;
  } catch (error) {
    console.error('❌ Erro ao criar sessão:', error.message);
    throw error;
  }
}

// Executar teste
testCreateSession();
```

### Teste 2: Backend - Obter Resultados

```javascript
async function testGetResults(sessionId) {
  try {
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId
    });
    
    const response = await client.send(command);
    console.log('✅ Resultados obtidos com sucesso!');
    console.log('Status:', response.Status);
    console.log('Confidence:', response.Confidence);
    return response;
  } catch (error) {
    console.error('❌ Erro ao obter resultados:', error.message);
    throw error;
  }
}
```

### Teste 3: Frontend - Iniciar Sessão

```typescript
// src/app/services/face-liveness.service.ts
import { RekognitionClient, StartFaceLivenessSessionCommand } from '@aws-sdk/client-rekognition';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

const client = new RekognitionClient({
  region: 'sa-east-1',
  credentials: fromCognitoIdentityPool({
    clientConfig: { region: 'sa-east-1' },
    identityPoolId: 'sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa'
  })
});

async function testStartSession(sessionId: string) {
  try {
    const command = new StartFaceLivenessSessionCommand({
      SessionId: sessionId
    });
    
    const response = await client.send(command);
    console.log('✅ Sessão iniciada no frontend!');
    return response;
  } catch (error) {
    console.error('❌ Erro ao iniciar sessão:', error.message);
    throw error;
  }
}
```

---

## 🔍 Verificar Permissões

### Verificar Políticas do Usuário IAM

```bash
# Listar todas as políticas inline
aws iam list-user-policies --user-name hjonas

# Ver detalhes de uma política específica
aws iam get-user-policy --user-name hjonas --policy-name RekognitionFaceLivenessPolicy

# Listar políticas gerenciadas anexadas
aws iam list-attached-user-policies --user-name hjonas
```

### Verificar Configuração do Cognito

```bash
# Ver detalhes do Identity Pool
aws cognito-identity describe-identity-pool \
  --identity-pool-id sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa

# Ver roles associadas
aws cognito-identity get-identity-pool-roles \
  --identity-pool-id sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa

# Ver permissões da role de não autenticados
aws iam get-role-policy \
  --role-name LivenessPool_Unauth_Role \
  --policy-name RekognitionFaceLivenessPolicy
```

---

## 📊 Monitoramento

### CloudWatch Logs

As chamadas ao Rekognition podem ser monitoradas via CloudTrail:

```bash
# Ver eventos recentes do Rekognition
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::Rekognition::FaceLivenessSession \
  --max-results 10
```

### Custos

Monitore os custos do Face Liveness:

```bash
# Ver custos do Rekognition
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-12-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://cost-filter.json
```

---

## 🆘 Troubleshooting

### Erro: "AccessDeniedException"

Se você receber este erro, verifique:

1. **Credenciais corretas no `.env`**:
   ```bash
   aws sts get-caller-identity
   ```

2. **Política anexada ao usuário**:
   ```bash
   aws iam get-user-policy --user-name hjonas --policy-name RekognitionFaceLivenessPolicy
   ```

3. **Aguarde propagação** (pode levar alguns minutos)

### Erro: "InvalidParameterException"

- Verifique se o `sessionId` é válido
- Confirme que a sessão foi criada no backend primeiro
- Verifique se a região está correta

### Erro: "ThrottlingException"

- Você atingiu o limite de requisições
- Implemente retry com backoff exponencial
- Considere aumentar os limites via AWS Support

---

## 📚 Documentação Relacionada

- [Configuração do Cognito](docs/cognito-setup.md)
- [Permissões IAM](docs/iam-permissions-setup.md)
- [Resumo do Cognito](COGNITO_SETUP_SUMMARY.md)

---

## 🎉 Próximos Passos

Agora que as permissões estão configuradas, você pode:

1. ✅ Implementar os endpoints no backend (`/api/create-liveness-session`, `/api/liveness-results`)
2. ✅ Criar o serviço de credenciais no Angular
3. ✅ Integrar o componente de Face Liveness no frontend
4. ✅ Testar o fluxo completo
5. ✅ Implementar tratamento de erros e retry logic
6. ✅ Adicionar monitoramento e logs

Consulte `docs/cognito-setup.md` para exemplos completos de implementação!
