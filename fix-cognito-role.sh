#!/bin/bash

IDENTITY_POOL_ID="us-east-1:4bd13694-009f-4f2f-b836-10b691499bd2"
ROLE_NAME="Cognito_RekognitionLivenessUnauth_Role"

echo "🧹 Limpando role antiga..."
aws iam delete-role-policy \
  --role-name $ROLE_NAME \
  --policy-name RekognitionLivenessPolicy 2>/dev/null

aws iam delete-role \
  --role-name $ROLE_NAME 2>/dev/null

echo "✅ Role antiga removida"

echo "📝 Criando nova IAM Role..."
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file://cognito-trust-policy-unauth.json

echo "🔐 Anexando política de permissões..."
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name RekognitionLivenessPolicy \
  --policy-document file://cognito-unauth-role-policy.json

echo "⏳ Aguardando propagação da role (10 segundos)..."
sleep 10

echo "🔍 Pegando ARN da role..."
ROLE_ARN=$(aws iam get-role \
  --role-name $ROLE_NAME \
  --query 'Role.Arn' \
  --output text)

echo "✅ Role ARN: $ROLE_ARN"

echo "🔗 Associando role ao Identity Pool..."
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id "$IDENTITY_POOL_ID" \
  --roles unauthenticated=$ROLE_ARN \
  --region us-east-1

echo ""
echo "✅ Configuração completa!"
echo "🔄 Recarregue a página do navegador para testar o liveness"
