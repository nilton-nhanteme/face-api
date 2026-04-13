#!/bin/bash

echo "🚀 Criando Cognito Identity Pool em us-east-1..."

# 1. Criar Identity Pool
IDENTITY_POOL=$(aws cognito-identity create-identity-pool \
  --identity-pool-name "RekognitionLivenessPool" \
  --allow-unauthenticated-identities \
  --region us-east-1 \
  --output json)

IDENTITY_POOL_ID=$(echo $IDENTITY_POOL | grep -o '"IdentityPoolId": "[^"]*' | cut -d'"' -f4)
echo "✅ Identity Pool criado: $IDENTITY_POOL_ID"

# 2. Criar IAM Role
echo "📝 Criando IAM Role..."
aws iam create-role \
  --role-name Cognito_RekognitionLivenessUnauth_Role \
  --assume-role-policy-document file://cognito-trust-policy-unauth.json

# 3. Anexar política
echo "🔐 Anexando política de permissões..."
aws iam put-role-policy \
  --role-name Cognito_RekognitionLivenessUnauth_Role \
  --policy-name RekognitionLivenessPolicy \
  --policy-document file://cognito-unauth-role-policy.json

# 4. Pegar ARN da role
ROLE_ARN=$(aws iam get-role \
  --role-name Cognito_RekognitionLivenessUnauth_Role \
  --query 'Role.Arn' \
  --output text)

echo "✅ Role ARN: $ROLE_ARN"

# 5. Associar role ao Identity Pool
echo "🔗 Associando role ao Identity Pool..."
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id "$IDENTITY_POOL_ID" \
  --roles unauthenticated=$ROLE_ARN \
  --region us-east-1

echo ""
echo "✅ Configuração completa!"
echo ""
echo "📋 Atualize seu .env com:"
echo "COGNITO_IDENTITY_POOL_ID=$IDENTITY_POOL_ID"
echo "AWS_REGION=us-east-1"
echo ""
echo "📋 Atualize src/main.ts com:"
echo "identityPoolId: '$IDENTITY_POOL_ID'"
