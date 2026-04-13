# Configuração do Cognito Identity Pool para Face Liveness

Este guia documenta a configuração do Cognito Identity Pool para permitir que usuários não autenticados (convidados) usem o Face Liveness.

## ✅ Configuração Concluída

O Identity Pool foi criado e configurado com sucesso!

### Informações do Identity Pool

```json
{
  "IdentityPoolId": "sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa",
  "IdentityPoolName": "LivenessPool",
  "Region": "sa-east-1",
  "AllowUnauthenticatedIdentities": true,
  "Roles": {
    "unauthenticated": "arn:aws:iam::629205655921:role/LivenessPool_Unauth_Role"
  }
}
```

### Permissões Configuradas

A role `LivenessPool_Unauth_Role` possui as seguintes permissões:

- ✅ `rekognition:StartFaceLivenessSession` - Permite iniciar sessões de Face Liveness

---

## 🔧 Como Usar no Frontend

### 1. Instalar Dependências

```bash
npm install @aws-sdk/client-rekognition @aws-sdk/credential-providers
```

### 2. Configurar Credenciais do Cognito

Adicione as configurações no seu arquivo de ambiente (`.env` ou similar):

```env
COGNITO_IDENTITY_POOL_ID=sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa
AWS_REGION=sa-east-1
```

### 3. Exemplo de Código Angular

Crie um serviço para gerenciar as credenciais:

```typescript
// src/app/services/aws-credentials.service.ts
import { Injectable } from '@angular/core';
import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

@Injectable({
  providedIn: 'root'
})
export class AwsCredentialsService {
  private rekognitionClient: RekognitionClient;

  constructor() {
    this.rekognitionClient = new RekognitionClient({
      region: 'sa-east-1',
      credentials: fromCognitoIdentityPool({
        clientConfig: { region: 'sa-east-1' },
        identityPoolId: 'sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa'
      })
    });
  }

  getRekognitionClient(): RekognitionClient {
    return this.rekognitionClient;
  }
}
```

### 4. Usar o Face Liveness

```typescript
// src/app/services/face-liveness.service.ts
import { Injectable, inject } from '@angular/core';
import { StartFaceLivenessSessionCommand } from '@aws-sdk/client-rekognition';
import { AwsCredentialsService } from './aws-credentials.service';

@Injectable({
  providedIn: 'root'
})
export class FaceLivenessService {
  private awsCredentials = inject(AwsCredentialsService);

  async startLivenessSession(sessionId: string): Promise<void> {
    const client = this.awsCredentials.getRekognitionClient();
    
    const command = new StartFaceLivenessSessionCommand({
      SessionId: sessionId
    });

    try {
      const response = await client.send(command);
      console.log('✅ Sessão de liveness iniciada:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao iniciar sessão:', error);
      throw error;
    }
  }
}
```

### 5. Integração com o Backend

O fluxo completo funciona assim:

```typescript
// 1. Backend cria a sessão
async createLivenessSession() {
  const response = await fetch('/api/create-liveness-session', {
    method: 'POST'
  });
  const { sessionId } = await response.json();
  return sessionId;
}

// 2. Frontend inicia a sessão com o sessionId
async startLiveness() {
  const sessionId = await this.createLivenessSession();
  await this.faceLivenessService.startLivenessSession(sessionId);
  
  // 3. Aqui você integraria o componente de UI do Face Liveness
  // (AWS fornece um componente React/Web que pode ser adaptado)
}

// 4. Backend obtém os resultados
async getLivenessResults(sessionId: string) {
  const response = await fetch(`/api/liveness-results/${sessionId}`);
  return await response.json();
}
```

---

## 🔐 Segurança

### Usuários Não Autenticados (Convidados)

A configuração atual permite que qualquer pessoa use o Face Liveness sem autenticação. Isso é útil para:

- ✅ Demos e protótipos
- ✅ Verificação inicial antes do cadastro
- ✅ Experiência de usuário simplificada

### Considerações de Segurança

1. **Limite de Taxa**: Configure rate limiting no backend para evitar abuso
2. **Custos**: Monitore o uso, pois cada sessão tem custo
3. **Validação**: Sempre valide os resultados no backend, nunca confie apenas no frontend

### Adicionar Usuários Autenticados (Opcional)

Se você quiser adicionar suporte para usuários autenticados no futuro:

```bash
# 1. Criar trust policy para usuários autenticados
# 2. Criar role para autenticados
aws iam create-role \
  --role-name LivenessPool_Auth_Role \
  --assume-role-policy-document file://cognito-trust-policy-auth.json

# 3. Anexar permissões
aws iam put-role-policy \
  --role-name LivenessPool_Auth_Role \
  --policy-name RekognitionFaceLivenessPolicy \
  --policy-document file://cognito-unauth-role-policy.json

# 4. Associar ao Identity Pool
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id "sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa" \
  --roles authenticated=arn:aws:iam::629205655921:role/LivenessPool_Auth_Role \
         unauthenticated=arn:aws:iam::629205655921:role/LivenessPool_Unauth_Role
```

---

## 🧪 Testar a Configuração

### Teste Rápido via Console do Navegador

```javascript
// Cole isso no console do navegador após configurar o serviço
import { RekognitionClient, StartFaceLivenessSessionCommand } from '@aws-sdk/client-rekognition';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

const client = new RekognitionClient({
  region: 'sa-east-1',
  credentials: fromCognitoIdentityPool({
    clientConfig: { region: 'sa-east-1' },
    identityPoolId: 'sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa'
  })
});

// Você precisará de um sessionId válido do backend
const command = new StartFaceLivenessSessionCommand({
  SessionId: 'seu-session-id-aqui'
});

client.send(command)
  .then(response => console.log('✅ Sucesso:', response))
  .catch(error => console.error('❌ Erro:', error));
```

---

## 📊 Monitoramento

### CloudWatch Metrics

Monitore o uso do Identity Pool:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Cognito \
  --metric-name IdentityPoolId \
  --dimensions Name=IdentityPoolId,Value=sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### CloudTrail

Habilite o CloudTrail para auditar chamadas:

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa
```

---

## 🆘 Troubleshooting

### Erro: "NotAuthorizedException"

```
User: arn:aws:sts::629205655921:assumed-role/LivenessPool_Unauth_Role/... 
is not authorized to perform: rekognition:StartFaceLivenessSession
```

**Solução**: Verifique se a política foi anexada corretamente:

```bash
aws iam get-role-policy \
  --role-name LivenessPool_Unauth_Role \
  --policy-name RekognitionFaceLivenessPolicy
```

### Erro: "InvalidParameterException"

```
Invalid session ID format
```

**Solução**: O sessionId deve ser criado primeiro no backend usando `CreateFaceLivenessSession`.

### Erro: "AccessDeniedException"

```
User is not authorized to access this resource
```

**Solução**: Verifique se o Identity Pool está configurado corretamente:

```bash
aws cognito-identity describe-identity-pool \
  --identity-pool-id sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa
```

---

## 📚 Recursos Adicionais

- [AWS Cognito Identity Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools.html)
- [Face Liveness Documentation](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Credential Providers](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-credential-providers/)

---

## 🗑️ Limpeza (Opcional)

Se você precisar remover a configuração:

```bash
# 1. Remover associação de roles
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id "sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa" \
  --roles {}

# 2. Deletar política da role
aws iam delete-role-policy \
  --role-name LivenessPool_Unauth_Role \
  --policy-name RekognitionFaceLivenessPolicy

# 3. Deletar role
aws iam delete-role --role-name LivenessPool_Unauth_Role

# 4. Deletar Identity Pool
aws cognito-identity delete-identity-pool \
  --identity-pool-id "sa-east-1:6e888971-8b8d-4fe9-bc91-fa243239e7aa"
```
