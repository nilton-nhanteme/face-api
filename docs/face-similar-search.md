# Nota Tecnica - Face Similar Search

## Objetivo
Adicionar suporte completo de busca de faces similares com AWS Rekognition, incluindo:
- criacao de colecao (cofre)
- indexacao de imagens no cofre
- busca de faces similares por imagem

## Fluxo fim a fim
1. O usuario cria uma colecao no frontend.
2. O frontend envia `collectionId` para o backend (`Express SSR`).
3. O backend chama `CreateCollectionCommand` no AWS Rekognition.
4. O usuario indexa uma imagem facial com `externalImageId`.
5. O frontend converte imagem para base64 e envia ao backend.
6. O backend chama `IndexFacesCommand` para registrar a face no cofre.
7. O usuario envia uma imagem de consulta para similaridade.
8. O backend chama `SearchFacesByImageCommand` na mesma colecao.
9. O frontend exibe os matches (faceId, externalImageId, similaridade, confianca).

## Endpoints novos (REST)
### 1) Criar colecao
- Metodo: `POST`
- Endpoint: `/api/collections`
- Body:
```json
{
  "collectionId": "colaboradores-2026"
}
```
- Resposta (exemplo):
```json
{
  "message": "Colecao 'colaboradores-2026' criada com sucesso",
  "collectionId": "colaboradores-2026",
  "statusCode": 200,
  "requestId": "..."
}
```

### 2) Indexar imagem no cofre
- Metodo: `POST`
- Endpoint: `/api/collections/:collectionId/faces`
- Body:
```json
{
  "imageBase64": "...",
  "externalImageId": "user_123"
}
```
- Resposta (exemplo):
```json
{
  "message": "Face indexada com sucesso na colecao 'colaboradores-2026'",
  "collectionId": "colaboradores-2026",
  "externalImageId": "user_123",
  "indexedFaces": [
    {
      "faceId": "...",
      "imageId": "...",
      "confidence": 99.8,
      "externalImageId": "user_123"
    }
  ],
  "unindexedFaces": []
}
```

### 3) Buscar faces similares
- Metodo: `POST`
- Endpoint: `/api/collections/:collectionId/search-similar-faces`
- Body:
```json
{
  "imageBase64": "...",
  "faceMatchThreshold": 80,
  "maxFaces": 5
}
```
- Resposta (exemplo):
```json
{
  "collectionId": "colaboradores-2026",
  "searchedFace": {
    "Width": 0.2,
    "Height": 0.2,
    "Left": 0.4,
    "Top": 0.2
  },
  "faceMatches": [
    {
      "similarity": 96.32,
      "faceId": "...",
      "externalImageId": "user_123",
      "confidence": 99.7,
      "imageId": "..."
    }
  ]
}
```

## Compatibilidade com endpoints existentes
Os endpoints antigos foram mantidos para nao quebrar integracoes existentes:
- `POST /api/admin/create-collection`
- `POST /api/admin/index-face`
- `POST /api/search-similar-faces`

## Frontend
Nova tela standalone adicionada para orquestrar os 3 passos:
- componente: `src/app/similar-face-search/`
- rota: `/similar-face-search`
- menu: `Similar Search`

## Servico Angular
Novos metodos adicionados em `FaceApiService`:
- `createCollection(collectionId)`
- `indexFaceInCollection(imageBlob, collectionId, externalImageId)`
- `searchSimilarFacesInCollection(imageBlob, collectionId, faceMatchThreshold, maxFaces)`

## Validacoes implementadas
- validacao de campos obrigatorios no backend
- sanitizacao minima de string (`trim`)
- tratamento de imagem em base64 com suporte a `data URL`

## Consideracoes operacionais
- As credenciais AWS continuam no backend (SSR), sem exposicao no browser.
- O limite de payload JSON permanece em `10mb`.
- Recomenda-se usar `externalImageId` padronizado (ex.: ID de utilizador interno).
