import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { 
  RekognitionClient, 
  DetectFacesCommand, 
  IndexFacesCommand, 
  CreateFaceLivenessSessionCommand, 
  GetFaceLivenessSessionResultsCommand,
  CompareFacesCommand, 
  SearchFacesByImageCommand,
  CreateCollectionCommand,
  ListCollectionsCommand
} from '@aws-sdk/client-rekognition';
import { environment } from './environments/environment';
import { error } from 'node:console';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json({ limit: '10mb' }));

function getRequiredEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Configuração do Rekognition no servidor (Proxy)
const region = getRequiredEnv(environment.region, 'REGION');
const accessKeyId = getRequiredEnv(environment.access_key_id, 'ACCESS_KEY_ID');
const secretAccessKey = getRequiredEnv(environment.secret_access_key, 'SECRET_ACCESS_KEY');
const s3BucketName = getRequiredEnv(environment.s3_bucket_name, 'S3_BUCKET_NAME');

const rekognitionClient = new RekognitionClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  }
});

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  }
})

/**
 * API Proxy para o Rekognition (Evita CORS e protege as chaves)
 */
app.post('/api/detect-face', async (req, res): Promise<any> => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Imagem não fornecida' });
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    const command = new DetectFacesCommand({
      Image: { Bytes: buffer },
      Attributes: ['ALL'],
    });

    const data = await rekognitionClient.send(command);
    return res.json(data);
  } catch (error: any) {
    console.error('Erro no Rekognition Proxy:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
});

app.get('/api/create-liveness-session', async (req, res): Promise<any> => {
  try {
    //Cria nova sessão de liveness em branco
    const faceLivenessCommand = new CreateFaceLivenessSessionCommand({});
    const data = await rekognitionClient.send(faceLivenessCommand);

    //Devolve o ID da sessão para o frontend
    return res.json({
      sessionId: data.SessionId
    });
  } catch (erro: any) {
    console.error('Erro ao criar sessão de Liveness: ', erro);
    return res.status(500).json({
      error: erro.message || 'Erro ao gerar sessão'
    });
  }
})

/**
 * API Proxy para o CompareFaces (Verificação entre duas imagens)
 */
app.post('/api/verify-face', async (req, res): Promise<any> => {
  try {
    const { sourceImageBase64, targetImageBase64 } = req.body;
    if (!sourceImageBase64 || !targetImageBase64) {
      return res.status(400).json({ error: 'Imagens de origem ou destino não fornecidas' });
    }

    const sourceBuffer = Buffer.from(sourceImageBase64, 'base64');
    const targetBuffer = Buffer.from(targetImageBase64, 'base64');

    const command = new CompareFacesCommand({
      SourceImage: { Bytes: sourceBuffer },
      TargetImage: { Bytes: targetBuffer },
      SimilarityThreshold: 80,
    });

    const data = await rekognitionClient.send(command);
    return res.json(data);
  } catch (error: any) {
    console.error('Erro no Rekognition Compare Proxy:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
});
/**
 * API Proxy para verificar liveness e comparar com imagem alvo
 */
app.post('/api/verify-liveness-and-compare', async (req, res): Promise<any> => {
  try {
    const { sessionId, targetImageBase64 } = req.body;

    if (!sessionId || !targetImageBase64) {
      return res.status(400).json({ error: 'sessionId e targetImageBase64 são obrigatórios.' });
    }

    // 1. Obter imagem do liveness
    const livenessCommand = new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId });
    const livenessData = await rekognitionClient.send(livenessCommand);

    if (livenessData.Status !== 'SUCCEEDED') {
      return res.status(400).json({ error: 'A sessão de liveness não foi concluída corretamente.' });
    }

    if ((livenessData.Confidence ?? 0) < 90) {
      return res.status(401).json({
        error: 'Falha na Prova de Vida. A pessoa não parece ser real.',
        confidence: livenessData.Confidence
      });
    }

    const sourceBytes = livenessData.ReferenceImage?.Bytes;
    if (!sourceBytes) {
      return res.status(400).json({ error: 'Nenhuma imagem pôde ser extraída do liveness.' });
    }

    // 2. Comparar com a imagem alvo
    const targetBuffer = Buffer.from(targetImageBase64, 'base64');
    const compareCommand = new CompareFacesCommand({
      SourceImage: { Bytes: sourceBytes },
      TargetImage: { Bytes: targetBuffer },
      SimilarityThreshold: 80,
    });

    const compareData = await rekognitionClient.send(compareCommand);

    return res.json({
      livenessConfidence: livenessData.Confidence,
      FaceMatches: compareData.FaceMatches,
      UnmatchedFaces: compareData.UnmatchedFaces,
    });

  } catch (error: any) {
    console.error('Erro no verify-liveness-and-compare:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
});

const angularApp = new AngularNodeAppEngine();

/* 
API Proxy para o SearchFacesByImage (Busca por faces similares em uma coleção)
 */
app.post('/api/search-similar-faces', async (req, res): Promise<any> => {
  try {
    const { imageBase64, collectionId } = req.body;

    if (!imageBase64 || !collectionId) {
      return res.status(400).json({
        error: 'Imagem ou ID da coleção não fornecidos',
      });
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    const faceMatchThreshold = Math.min(Math.max(Number(req.body?.faceMatchThreshold ?? 80), 0), 100);
    const maxFaces = Math.min(Math.max(Number(req.body?.maxFaces ?? 20), 1), 25);

    //Configuração do comando AWS
    const command = new SearchFacesByImageCommand({
      CollectionId: collectionId, //Cofre criado previamente no AWS Rekognition
      Image: {
        Bytes: buffer //Imagem convertida para buffer
      },
      FaceMatchThreshold: faceMatchThreshold,
      MaxFaces: maxFaces,
    });

    const data = await rekognitionClient.send(command);
    return res.json(data);

  } catch (error: any) {
    console.error('Erro no Rekognition Search Proxy:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
});

/* 
API Proxy para o SearchFacesByImage com Liveness
 */
app.post('/api/search-similar-faces-with-liveness', async (req, res): Promise<any> => {
  try {
    const { sessionId, collectionId, faceMatchThreshold, maxFaces } = req.body;

    if (!sessionId || !collectionId) {
      return res.status(400).json({ error: 'Faltando sessionId ou collectionId.' });
    }

    const getResultsCommand = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId
    });
    const livenessData = await rekognitionClient.send(getResultsCommand);

    if (livenessData.Status !== "SUCCEEDED") {
      return res.status(400).json({ error: 'A captura ao vivo não foi concluída corretamente.' });
    }

    const confidence = livenessData.Confidence;
    if (confidence === undefined || confidence < 90) {
      return res.status(401).json({ 
        error: 'Falha na Prova de Vida. A pessoa não parece ser real.', 
        confidence 
      });
    }

    const liveImageBytes = livenessData.ReferenceImage?.Bytes;
    if (!liveImageBytes) {
      return res.status(400).json({ error: 'Nenhuma foto pôde ser extraída do vídeo.' });
    }

    const command = new SearchFacesByImageCommand({
      CollectionId: collectionId,
      Image: { Bytes: liveImageBytes },
      FaceMatchThreshold: Math.min(Math.max(Number(faceMatchThreshold ?? 80), 0), 100),
      MaxFaces: Math.min(Math.max(Number(maxFaces ?? 20), 1), 25),
    });

    const searchData = await rekognitionClient.send(command);
    return res.json({
      livenessConfidence: confidence,
      status: livenessData.Status,
      referenceImage: livenessData.ReferenceImage,
      auditImages: livenessData.AuditImages,
      FaceMatches: searchData.FaceMatches
    });

  } catch (error: any) {
    console.error('Erro no Rekognition Search Liveness Proxy:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
});

/*
API Proxy para criar uma coleção no Rekognition (Administração de coleções de faces)
 */
app.post('/api/admin/create-collection', async (req, res): Promise<any> => {
  try {
    const { collectionId } = req.body;

    if (!collectionId) {
      return res.status(400).json({
        error: 'O nome da coleção é obrigatório',
      });
    }

    const command = new CreateCollectionCommand({
      CollectionId: collectionId
    });

    const data = await rekognitionClient.send(command);
    return res.status(200).json({
      message: `Coleção '${collectionId}' criada com sucesso`,
      statusCode: data.$metadata.httpStatusCode,
      data: data
    })

  } catch (error: any) {
    console.error('Erro no Rekognition Create Collection Proxy:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
});

/*
API Proxy para listar coleções disponíveis no Rekognition
 */
app.get('/api/admin/collections', async (_req, res): Promise<any> => {
  try {
    const command = new ListCollectionsCommand({
      MaxResults: 100,
    });

    const data = await rekognitionClient.send(command);
    return res.status(200).json({
      collectionIds: data.CollectionIds ?? [],
    });
  } catch (error: any) {
    console.error('Erro ao listar coleções do Rekognition:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
});

/*
API Proxy para indexar uma face em uma coleção (Administração de faces nas coleções)
  - Permite adicionar uma nova face a uma coleção existente, associando-a a um ID externo para fácil identificação.
 */
app.post('/api/admin/index-face', async (req, res): Promise<any> => {
  try {
    const { collectionId, imageBase64, externalImageId } = req.body;

    if (!imageBase64 || !collectionId || !externalImageId) {
      return res.status(400).json({
        error: 'Imagem, ID da coleção e ID externo são obrigatórios',
      });
    }

    const buffer = Buffer.from(imageBase64, 'base64');

    const command = new IndexFacesCommand({
      CollectionId: collectionId,
      Image: {
        Bytes: buffer
      },
      ExternalImageId: externalImageId,
    });

    const s3Command = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: `${externalImageId}.jpg`,
      Body: buffer,
      ContentType: 'image/jpeg',
    })

    const data = await rekognitionClient.send(command);

    await s3Client.send(s3Command);
    return res.status(200).json({
      message: `Face indexada com sucesso na coleção '${collectionId}'`,
      FaceRecords: data.FaceRecords, // Aqui virá o FaceId gerado pelo Rekognition da AWS
    });

  } catch (error: any) {
    console.error('Erro no Rekognition Index Face Proxy:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
})

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

/*
API Proxy para obter os resultados da sessão de liveness
 */
app.get('/api/get-liveness-results/:sessionId', async (req, res): Promise<any> => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'SessionId não fornecido' });
    }

    const { GetFaceLivenessSessionResultsCommand } = await import('@aws-sdk/client-rekognition');
    
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId
    });

    const data = await rekognitionClient.send(command);
    
    return res.json({
      status: data.Status,
      confidence: data.Confidence,
      referenceImage: data.ReferenceImage, // Imagem capturada durante o liveness
      auditImages: data.AuditImages
    });
  } catch (error: any) {
    console.error('Erro ao obter resultados do liveness:', error);
    return res.status(500).json({ error: error.message || 'Erro ao obter resultados' });
  }
});
