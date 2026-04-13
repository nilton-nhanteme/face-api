/**
 * Script de Teste de Permissões do Face Liveness
 * 
 * Este script testa se as permissões do IAM foram configuradas corretamente
 * para o usuário do backend.
 * 
 * Uso: node test-permissions.js
 */

import { RekognitionClient, CreateFaceLivenessSessionCommand, GetFaceLivenessSessionResultsCommand } from '@aws-sdk/client-rekognition';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Configurar cliente do Rekognition
const client = new RekognitionClient({
  region: process.env.REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  }
});

console.log('🧪 Testando Permissões do Face Liveness\n');
console.log('═══════════════════════════════════════\n');

/**
 * Teste 1: Criar uma sessão de Face Liveness
 */
async function testCreateSession() {
  console.log('📝 Teste 1: CreateFaceLivenessSession');
  console.log('─────────────────────────────────────');
  
  try {
    const command = new CreateFaceLivenessSessionCommand({
      Settings: {
        OutputConfig: {
          S3Bucket: process.env.S3_BUCKET_NAME || 'rekogn-images-collection',
          S3KeyPrefix: 'liveness-sessions/'
        }
      }
    });
    
    const response = await client.send(command);
    
    console.log('✅ SUCESSO: Sessão criada com sucesso!');
    console.log(`   SessionId: ${response.SessionId}`);
    console.log('');
    
    return response.SessionId;
  } catch (error) {
    console.error('❌ ERRO:', error.name);
    console.error('   Mensagem:', error.message);
    
    if (error.name === 'AccessDeniedException') {
      console.error('\n   💡 Solução: Verifique se a permissão rekognition:CreateFaceLivenessSession foi adicionada');
      console.error('      Comando: aws iam get-user-policy --user-name hjonas --policy-name RekognitionFaceLivenessPolicy');
    }
    
    console.log('');
    return null;
  }
}

/**
 * Teste 2: Tentar obter resultados de uma sessão
 * (Vai falhar porque a sessão não foi completada, mas testa a permissão)
 */
async function testGetResults(sessionId) {
  console.log('📝 Teste 2: GetFaceLivenessSessionResults');
  console.log('─────────────────────────────────────');
  
  if (!sessionId) {
    console.log('⏭️  PULADO: Não há sessionId do teste anterior');
    console.log('');
    return;
  }
  
  try {
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId
    });
    
    const response = await client.send(command);
    
    console.log('✅ SUCESSO: Permissão verificada!');
    console.log(`   Status: ${response.Status}`);
    console.log('');
  } catch (error) {
    // Se o erro for "SessionNotFoundException" ou "InvalidParameterException",
    // significa que a permissão está OK, apenas a sessão não foi completada
    if (error.name === 'SessionNotFoundException' || 
        error.name === 'InvalidParameterException' ||
        error.message.includes('not found') ||
        error.message.includes('not completed')) {
      console.log('✅ SUCESSO: Permissão verificada!');
      console.log('   (Sessão não completada ainda, mas a permissão está OK)');
      console.log('');
    } else if (error.name === 'AccessDeniedException') {
      console.error('❌ ERRO:', error.name);
      console.error('   Mensagem:', error.message);
      console.error('\n   💡 Solução: Verifique se a permissão rekognition:GetFaceLivenessSessionResults foi adicionada');
      console.error('      Comando: aws iam get-user-policy --user-name hjonas --policy-name RekognitionFaceLivenessPolicy');
      console.log('');
    } else {
      console.error('❌ ERRO:', error.name);
      console.error('   Mensagem:', error.message);
      console.log('');
    }
  }
}

/**
 * Executar todos os testes
 */
async function runTests() {
  console.log('🔐 Usuário IAM: hjonas');
  console.log(`🌍 Região: ${process.env.REGION || 'us-east-1'}`);
  console.log(`📦 Bucket S3: ${process.env.S3_BUCKET_NAME || 'rekogn-images-collection'}`);
  console.log('');
  
  const sessionId = await testCreateSession();
  await testGetResults(sessionId);
  
  console.log('═══════════════════════════════════════');
  console.log('🎉 Testes Concluídos!');
  console.log('');
  console.log('📚 Próximos Passos:');
  console.log('   1. Implementar endpoints no backend');
  console.log('   2. Configurar frontend com Cognito');
  console.log('   3. Integrar componente de Face Liveness');
  console.log('');
  console.log('📖 Documentação: docs/cognito-setup.md');
}

// Executar
runTests().catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
