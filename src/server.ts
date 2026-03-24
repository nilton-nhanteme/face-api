import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { RekognitionClient, DetectFacesCommand } from '@aws-sdk/client-rekognition';
import { CompareFacesCommand, CompareFacesResponse } from "@aws-sdk/client-rekognition";
import { environment } from './environments/environment';

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

const rekognitionClient = new RekognitionClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  }
});

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
const angularApp = new AngularNodeAppEngine();

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
