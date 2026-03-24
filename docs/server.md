### Documentação do Servidor (`src/server.ts`)

Este arquivo é o ponto de entrada principal para o servidor da aplicação, que é construído com o framework **Express.js** e integrado com o **Angular Universal** para renderização do lado do servidor (SSR).

#### 1. Importações

O arquivo começa importando as dependências necessárias:

- **`@angular/ssr/node`**: Módulos para integrar o Angular com um servidor Node.js.
- **`express`**: O framework web para Node.js usado para criar o servidor.
- **`node:path`**: Módulo nativo do Node.js para trabalhar com caminhos de arquivos.
- **`@aws-sdk/client-rekognition`**: O cliente do AWS Rekognition para interagir com a API de detecção de faces.

#### 2. Configuração do Express

O servidor Express é inicializado e configurado:

```typescript
const app = express();
app.use(express.json({ limit: '10mb' }));
```

- `express()`: Cria uma nova instância da aplicação Express.
- `express.json({ limit: '10mb' })`: Adiciona um middleware para interpretar o corpo das requisições como JSON. O limite de `10mb` é definido para permitir o envio de imagens em formato base64.

#### 3. Proxy para o AWS Rekognition

Para evitar problemas de CORS (Cross-Origin Resource Sharing) e para proteger as credenciais da AWS, o servidor atua como um proxy para a API do Rekognition.

```typescript
const rekognitionClient = new RekognitionClient({
  region: process.env['REGION'],
  credentials: {
    accessKeyId: process.env['ACCESS_KEY_ID'],
    secretAccessKey: process.env['SECRET_ACCESS_KEY'],
  }
});

app.post('/api/detect-face', async (req, res): Promise<any> => {
  // ... lógica para chamar a API do Rekognition ...
});

app.post('/api/verify-face', async (req, res): Promise<any> => {
  // ... lógica para comparar faces usando o Rekognition ...
});
```

- **`rekognitionClient`**: Uma instância do cliente do Rekognition é criada com as credenciais da AWS. **É importante notar que as credenciais estão hardcoded no código, o que não é uma boa prática de segurança. O ideal seria usar variáveis de ambiente ou um serviço de gerenciamento de segredos.**
- **`app.post('/api/detect-face', ...)`**: Uma rota `POST` é criada em `/api/detect-face`. Quando o frontend envia uma imagem para esta rota, o servidor a repassa para a API do Rekognition e retorna a resposta.
- **`app.post('/api/verify-face', ...)`**: Uma rota `POST` é criada em `/api/verify-face`. Quando o frontend envia duas imagens para esta rota, o servidor as compara usando a API do Rekognition e retorna o resultado da comparação.

#### 4. Servindo Arquivos Estáticos

O servidor é configurado para servir os arquivos estáticos da aplicação Angular (HTML, CSS, JavaScript, etc.) que são gerados no diretório `browser`.

```typescript
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);
```

- `express.static()`: Serve os arquivos do diretório `browserDistFolder`.
- `maxAge: '1y'`: Define o cabeçalho `Cache-Control` para que os arquivos fiquem em cache no navegador por um ano.

#### 5. Renderização do Lado do Servidor (SSR) com Angular

Qualquer requisição que não seja para a API ou para um arquivo estático é tratada pelo motor de renderização do Angular.

```typescript
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});
```

- `angularApp.handle(req)`: O motor do Angular processa a requisição e renderiza a página correspondente no servidor.
- `writeResponseToNodeResponse(response, res)`: A resposta renderizada é enviada de volta para o navegador.

#### 6. Inicialização do Servidor

O servidor é iniciado na porta definida pela variável de ambiente `PORT` ou, por padrão, na porta `4000`.

```typescript
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    // ...
  });
}
```

- `isMainModule(import.meta.url)`: Verifica se o arquivo está sendo executado diretamente (não importado por outro módulo).
- `process.env['pm_id']`: Verifica se a aplicação está sendo executada pelo gerenciador de processos PM2.

#### 7. Handler para o Angular CLI

Finalmente, um handler é exportado para ser usado pelo Angular CLI durante o desenvolvimento e o build.

```typescript
export const reqHandler = createNodeRequestHandler(app);
```
