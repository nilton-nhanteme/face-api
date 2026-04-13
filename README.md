# FaceApi — Validação Facial com AWS Rekognition

Aplicação web full-stack para reconhecimento e validação facial usando **Angular 21** (SSR) no frontend e **Express.js** no backend, integrados ao **AWS Rekognition** e ao **AWS S3**.

---

## 🗂️ Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Configuração](#-configuração)
- [Como Executar](#-como-executar)
- [Endpoints da API](#-endpoints-da-api)
- [Testes](#-testes)
- [Build e Deploy](#-build-e-deploy)
- [Documentação Técnica](#-documentação-técnica)

---

## 🔍 Visão Geral

O **FaceApi** é um sistema de validação facial que permite detectar, comparar e buscar faces em coleções utilizando os serviços de inteligência artificial da AWS. A aplicação funciona como um proxy seguro: o frontend Angular se comunica com o servidor Express, que por sua vez interage com a API do AWS Rekognition, protegendo as credenciais AWS do lado do servidor.

---

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Detecção de Face** | Captura uma foto via câmera e analisa características faciais (gênero, idade estimada, emoções, sorriso) |
| **Comparação de Faces** | Compara uma captura ao vivo (Prova de Vida) com uma imagem enviada, retornando o nível de similaridade |
| **Busca de Faces Similares** | Indexa faces em coleções (cofres) e realiza buscas por faces similares com verificação de vivacidade |
| **Prova de Vida (Face Liveness)** | Integração com `@aws-amplify/ui-react-liveness` para verificar se o usuário é uma pessoa real |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│  Navegador (Angular 21 + SSR)                                   │
│  ┌───────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  Detectar     │  │  Comparar Faces  │  │  Buscar Faces   │  │
│  │  Face         │  │  (Liveness)      │  │  (Coleções)     │  │
│  └───────┬───────┘  └────────┬─────────┘  └────────┬────────┘  │
└──────────┼───────────────────┼────────────────────┼────────────┘
           │  HTTP /api/*      │                    │
┌──────────▼───────────────────▼────────────────────▼────────────┐
│  Servidor Express (Node.js + Angular SSR)                       │
│  Proxy seguro — gerencia credenciais AWS                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │  AWS SDK v3
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  AWS Rekognition      AWS Rekognition    AWS S3
  (DetectFaces,        (FaceLiveness,     (Backup de
  CompareFaces,        SearchFaces)       imagens indexadas)
  IndexFaces)
```

---

## 🛠️ Tecnologias

**Frontend**
- [Angular 21](https://angular.dev/) com Server-Side Rendering (SSR)
- [RxJS](https://rxjs.dev/) para programação reativa
- [AWS Amplify UI React Liveness](https://ui.docs.amplify.aws/react/connected-components/liveness) para Prova de Vida
- Angular Signals para gerenciamento de estado

**Backend**
- [Node.js](https://nodejs.org/) com [Express.js](https://expressjs.com/)
- [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) para integração com serviços AWS
- [AWS Rekognition](https://aws.amazon.com/rekognition/) para análise facial
- [AWS S3](https://aws.amazon.com/s3/) para armazenamento de imagens

---

## ✅ Pré-requisitos

- [Node.js](https://nodejs.org/) v20 ou superior
- [npm](https://www.npmjs.com/) v9 ou superior
- Conta AWS com acesso ao Rekognition e S3
- Usuário IAM com as permissões necessárias (consulte [docs/iam-permissions-setup.md](docs/iam-permissions-setup.md))
- Cognito Identity Pool configurado para o Face Liveness (consulte [docs/cognito-setup.md](docs/cognito-setup.md))

---

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com base no exemplo:

```bash
cp .env.example.txt .env
```

Preencha as variáveis no arquivo `.env`:

```env
# Credenciais do usuário IAM (backend)
ACCESS_KEY_ID=sua_access_key_id
SECRET_ACCESS_KEY=sua_secret_access_key
REGION=us-east-1          # Região usada pelo Rekognition no backend

# Bucket S3 para backup das imagens indexadas
S3_BUCKET_NAME=nome-do-seu-bucket

# Cognito Identity Pool (para Face Liveness no frontend)
# Nota: O Cognito Identity Pool pode estar em uma região diferente do Rekognition
COGNITO_IDENTITY_POOL_ID=sa-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AWS_REGION=sa-east-1      # Região do Cognito Identity Pool
```

> **Importante:** Nunca versione o arquivo `.env`. Ele já está no `.gitignore`.

---

## 🚀 Como Executar

### Servidor de desenvolvimento

```bash
ng serve
```

Acesse `http://localhost:4200/`. A aplicação recarrega automaticamente ao modificar os arquivos fonte.

### Servidor SSR (produção local)

```bash
ng build
node dist/face-api/server/server.mjs
```

Acesse `http://localhost:4000/`.

---

## 📡 Endpoints da API

O servidor Express expõe os seguintes endpoints:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/detect-face` | Detecta faces e retorna atributos (idade, gênero, emoções) |
| `POST` | `/api/verify-face` | Compara duas imagens e retorna nível de similaridade |
| `GET`  | `/api/create-liveness-session` | Cria uma sessão de Prova de Vida |
| `POST` | `/api/verify-liveness-and-compare` | Valida liveness e compara com imagem alvo |
| `POST` | `/api/search-similar-faces` | Busca faces similares em uma coleção por imagem |
| `POST` | `/api/search-similar-faces-with-liveness` | Busca faces similares usando captura ao vivo |
| `POST` | `/api/admin/create-collection` | Cria uma nova coleção de faces no Rekognition |
| `GET`  | `/api/admin/collections` | Lista todas as coleções disponíveis |
| `POST` | `/api/admin/index-face` | Indexa uma face em uma coleção e faz backup no S3 |

Para exemplos detalhados dos objetos de retorno, consulte [docs/api-responses.md](docs/api-responses.md).

---

## 🧪 Testes

Para executar os testes unitários com o [Vitest](https://vitest.dev/):

```bash
ng test
```

---

## 📦 Build e Deploy

```bash
ng build
```

Os artefatos de build são gerados na pasta `dist/`. Para o deploy, consulte o workflow de CI/CD em `.github/workflows/deploy.yml`.

---

## 📚 Documentação Técnica

A documentação detalhada está disponível na pasta [`docs/`](docs/):

| Documento | Descrição |
|---|---|
| [Retornos da API](docs/api-responses.md) | Estrutura dos objetos JSON retornados por cada endpoint |
| [Servidor Backend](docs/server.md) | Arquitetura do servidor Express e proxy da AWS |
| [Lógica da Aplicação](docs/application.md) | Componentes Angular e gerenciamento de estado com Signals |
| [Serviço de Face API](docs/face-api.md) | Comunicação entre frontend e backend |
| [Busca de Faces Similares](docs/face-similar-search.md) | Fluxo de busca em coleções e indexação com S3 |
| [Permissões IAM](docs/iam-permissions-setup.md) | Guia para configurar as permissões AWS necessárias |
| [Configuração do Cognito](docs/cognito-setup.md) | Configuração do Identity Pool para o Face Liveness |
