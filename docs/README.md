# Índice da Documentação

Bem-vindo à documentação técnica do projeto **FaceApi**. Aqui você encontrará detalhes sobre o funcionamento do servidor, da aplicação frontend e das integrações com o AWS Rekognition.

---

## 📄 Arquivos Disponíveis

1.  **[Retornos da API (AWS Rekognition)](api-responses.md)**
    *   Exemplos de objetos JSON retornados por cada endpoint.
    *   Estruturas de sucesso e erro.

2.  **[Servidor Backend (Express Proxy)](server.md)**
    *   Configuração do servidor Node.js.
    *   Implementação do Proxy para a AWS (Rekognition e S3).
    *   Gerenciamento de credenciais e segurança.

3.  **[Lógica da Aplicação (Angular)](application.md)**
    *   Componentes e fluxos de interação.
    *   Uso de *Signals* para gerenciamento de estado.
    *   Captura de imagem da câmera e processamento local.

4.  **[Serviço de Integração (FaceApiService)](face-api.md)**
    *   Métodos de comunicação entre frontend e backend.
    *   Fluxo de conversão de dados (Blob para Base64).

5.  **[Busca de Faces Similares](face-similar-search.md)**
    *   Documentação detalhada sobre o fluxo de busca em coleções (Cofres).
    *   Processo de indexação e armazenamento de backup no S3.

6.  **[Configuração de Permissões IAM](iam-permissions-setup.md)**
    *   Guia completo para adicionar permissões do Face Liveness.
    *   Instruções para Backend (Node.js) e Frontend (Cognito).
    *   Exemplos de políticas IAM e comandos AWS CLI.

7.  **[Configuração do Cognito Identity Pool](cognito-setup.md)**
    *   Identity Pool configurado para usuários não autenticados.
    *   Exemplos de código para integração no Angular.
    *   Fluxo completo de Face Liveness (Backend + Frontend).

---

## 🛠️ Tecnologias Documentadas

*   **Frontend**: Angular 21+, Signals, RxJS, MediaDevices API.
*   **Backend**: Node.js, Express, AWS SDK v3.
*   **Serviços AWS**: Rekognition (Face Detection, Comparison, Indexing) e S3 (Backup de Imagens).
