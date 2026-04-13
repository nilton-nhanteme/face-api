# Documentação dos Retornos da API (AWS Rekognition)

Esta documentação descreve as estruturas de dados retornadas por cada endpoint da API configurada no servidor backend que faz a ponte com o AWS Rekognition.

---

## 1. Detecção de Faces
**Endpoint:** `POST /api/detect-face`  
**Objetivo:** Identificar faces em uma imagem e extrair os respectivos atributos.


```json
{
  "FaceDetails": [
    {
      "BoundingBox": { //
        "Width": 0.2, "Height": 0.3, "Left": 0.4, "Top": 0.2
      },
      "AgeRange": { "Low": 25, "High": 35 }, //Idade media
      "Smile": { "Value": true, "Confidence": 98.5 }, //Sorriso
      "Confidence": 98.5, //Confiança do resultado
      "Eyeglasses": { "Value": false, "Confidence": 99.1 }, //Detecção de lentes
      "Sunglasses": { "Value": false, "Confidence": 99.8 }, //Detecção de lentes
      "Gender": { "Value": "Female", "Confidence": 98.9 }, //Sexo
      "Beard": { "Value": false, "Confidence": 99.7 }, //Detecção de barba
      "Mustache": { "Value": false, "Confidence": 99.9 }, //Detecção de barba
      "EyesOpen": { "Value": true, "Confidence": 97.4 }, //Olhos abertosos
      "MouthOpen": { "Value": true, "Confidence": 97.4 }, //Mouth abertosos
      "Emotions": [ // Emoções
        { "Type": "HAPPY", "Confidence": 95.5 },
        { "Type": "CALM", "Confidence": 3.2 }
      ],
      "Confidence": 99.9,
      "Landmarks": [ // Marcas faciais
        { "Type": "eyeLeft", "X": 0.45, "Y": 0.25 },  
        { "Type": "eyeRight", "X": 0.55, "Y": 0.25 }
      ]
      // Outros atributos faciais...
    }
  ],
  "$metadata": {
    "httpStatusCode": 200,
    "requestId": "..."
  }
}
```

---

## 2. Verificação/Comparação de Faces
**Endpoint:** `POST /api/verify-face`  
**Objetivo:** Comparar se duas imagens possuem a mesma pessoa.


```json
{
  "SourceImageFace": {
    "BoundingBox": { "Width": 0.3, "Height": 0.4, "Left": 0.3, "Top": 0.2 },
    "Confidence": 99.9
  },
  "FaceMatches": [
    {
      "Similarity": 98.5,
      "Face": {
        "BoundingBox": { "Width": 0.3, "Height": 0.4, "Left": 0.2, "Top": 0.2 },
        "Confidence": 99.9
      }
    }
  ],
  "UnmatchedFaces": [], // Retorna array preenchido caso a semelhança fique abaixo do Threshold
  "SourceImageOrientationCorrection": "ROTATE_0",
  "TargetImageOrientationCorrection": "ROTATE_0",
  "$metadata": {
    "httpStatusCode": 200,
    "requestId": "..."
  }
}
```

---

## 3. Busca de Faces Similares em Coleção
**Endpoint:** `POST /api/search-similar-faces`  
**Objetivo:** Buscar uma face em uma coleção (cofre) preexistente.

**Retorno de Sucesso (`200 OK`):**
Retorna o objeto `SearchFacesByImageResponse` da AWS.
```json
{
  "SearchedFaceBoundingBox": {
    "Width": 0.25, "Height": 0.35, "Left": 0.4, "Top": 0.2
  },
  "SearchedFaceConfidence": 99.9,
  "FaceMatches": [
    {
      "Similarity": 96.32,
      "Face": {
        "FaceId": "d3bd2a44-0c58-450f-...",
        "BoundingBox": { "Width": 0.25, "Height": 0.35, "Left": 0.4, "Top": 0.2 },
        "ImageId": "5e17415d-00eb-...",
        "ExternalImageId": "id-usuario-cadastrado", // Identificador setado no instante da indexação
        "Confidence": 99.9
      }
    }
  ],
  "FaceModelVersion": "6.0",
  "$metadata": {
    "httpStatusCode": 200,
    "requestId": "..."
  }
}
```

---

## 4. Criação de Coleção (Cofre)
**Endpoint:** `POST /api/admin/create-collection`  
**Objetivo:** Criar um novo repositório (Collection) no AWS Rekognition.

**Retorno de Sucesso (`200 OK`):**
Retorno padronizado pela nossa API proxy com o objeto da AWS dentro de `data`.
```json
{
  "message": "Coleção 'colaboradores-2026' criada com sucesso",
  "statusCode": 200,
  "data": {
    "CollectionArn": "aws:rekognition:us-east-1:123456789012:collection/colaboradores-2026",
    "FaceModelVersion": "6.0",
    "$metadata": {
      "httpStatusCode": 200,
      "requestId": "..."
    }
  }
}
```

---

## 5. Listagem de Coleções
**Endpoint:** `GET /api/admin/collections`  
**Objetivo:** Retornar a lista de IDs das coleções existentes na AWS.

**Retorno de Sucesso (`200 OK`):**
```json
{
  "collectionIds": [
    "colaboradores-2026",
    "visitantes-geral",
    "clientes-app"
  ]
}
```

---

## 6. Indexação de Faces (Cadastro no Cofre)
**Endpoint:** `POST /api/admin/index-face`  
**Objetivo:** Cadastrar/indexar uma face no banco do AWS Rekognition vinculado a um `externalImageId`. Além do AWS Rekognition, este endpoint salva um backup da imagem na AWS S3.

**Retorno de Sucesso (`200 OK`):**
Retorna a confirmação e a lista de registros indexados (`FaceRecords`).
```json
{
  "message": "Face indexada com sucesso na coleção 'colaboradores-2026'",
  "FaceRecords": [
    {
      "Face": {
        "FaceId": "8ce1d522-6b94-43ec-...",
        "BoundingBox": { "Width": 0.25, "Height": 0.35, "Left": 0.4, "Top": 0.2 },
        "ImageId": "5e17415d-00eb-...",
        "ExternalImageId": "user_hash_12345", // Esse ID pode ser cruzado com o banco relacional
        "Confidence": 99.8
      },
      "FaceDetail": {
        "BoundingBox": { "Width": 0.25, "Height": 0.35, "Left": 0.4, "Top": 0.2 },
        "AgeRange": { "Low": 25, "High": 35 },
        "Smile": { "Value": true, "Confidence": 95.0 },
        "Gender": { "Value": "Male", "Confidence": 99.3 }
        // Outros detalhes da face (Depende da configuração do Rekognition)
      }
    }
  ]
}
```

---

### Retornos Padrão de Erro (Gerais)
Se a requisição for mal formatada ou ocorrer algum problema durante o processo na AWS ou permissões:

**Erro (`400 Bad Request`):**
Faltou enviar a imagem base64 ou parâmetro obrigatório.
```json
{
  "error": "Imagem, ID da coleção e ID externo são obrigatórios"
}
```

**Erro (`500 Internal Server Error`):**
A API do AWS retornou um erro ou houve falha interna.
```json
{
  "error": "Mensagem detalhada proveniente do log de erro (ex: ResourceNotFoundException)"
}
```
