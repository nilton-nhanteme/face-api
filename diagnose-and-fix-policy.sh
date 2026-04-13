#!/bin/bash

ROLE_NAME="Cognito_RekognitionLivenessUnauth_Role"
POLICY_NAME="RekognitionLivenessPolicy"

echo "🔍 Verificando role..."
aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text

echo ""
echo "🔍 Verificando políticas inline anexadas..."
aws iam list-role-policies --role-name $ROLE_NAME

echo ""
echo "🔍 Tentando ver a política atual..."
aws iam get-role-policy \
  --role-name $ROLE_NAME \
  --policy-name $POLICY_NAME 2>&1

echo ""
echo "🔧 Reaplicando a política..."
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name $POLICY_NAME \
  --policy-document file://cognito-unauth-role-policy.json

echo ""
echo "✅ Política reaplicada. Verificando..."
aws iam get-role-policy \
  --role-name $ROLE_NAME \
  --policy-name $POLICY_NAME

echo ""
echo "⏳ Aguardando propagação (15 segundos)..."
sleep 15

echo ""
echo "✅ Pronto! Teste novamente no navegador."
