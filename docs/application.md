### Documentação da Lógica da Aplicação

#### 1. Rotas da Aplicação (`src/app/app.routes.ts`)

O arquivo `src/app/app.routes.ts` define as rotas da aplicação. Neste caso, o array `routes` está vazio, o que significa que a aplicação não tem rotas definidas e renderiza apenas o componente principal (`App`).

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [];
```

#### 2. Componente Principal (`src/app/app.ts`)

Este arquivo define o componente principal da aplicação, `App`, que é responsável por toda a lógica de interação com o usuário, incluindo o controle da câmera, a captura de imagens e a comunicação com o serviço de detecção de faces.

##### 2.1. Metadados do Componente

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
```

- **`selector: 'app-root'`**: Define o seletor CSS para este componente, que é usado para inseri-lo no `index.html`.
- **`standalone: true`**: Indica que este é um componente autônomo, que não precisa ser declarado em um `NgModule`.
- **`imports: [CommonModule]`**: Importa o `CommonModule`, que fornece diretivas como `*ngIf` e `*ngFor`.
- **`templateUrl: './app.html'`**: Especifica o arquivo HTML que contém o template do componente.
- **`styleUrls: ['./app.css']`**: Especifica os arquivos de estilo para o componente.

##### 2.2. Propriedades do Componente

O componente utiliza `signal` para gerenciar o estado da aplicação de forma reativa.

- **`@ViewChild('videoElement')` e `@ViewChild('canvasElement')`**: Referências aos elementos `<video>` e `<canvas>` no template, que são usados para exibir o feed da câmera e para capturar a imagem.
- **`isCameraActive`**: Um `signal` booleano que indica se a câmera está ativa.
- **`selectedImage`**: Um `signal` que armazena a imagem capturada em formato base64.
- **`isLoading`**: Um `signal` booleano que indica se a aplicação está processando uma imagem.
- **`detectionResult`**: Um `signal` que armazena o resultado da detecção de faces retornado pela API.

##### 2.3. Métodos do Componente

- **`constructor(private faceapi: FaceApiService)`**: Injeta o serviço `FaceApiService` para que o componente possa se comunicar com a API de detecção de faces.

- **`iniciarCamera()`**:
  - Solicita acesso à câmera do usuário usando `navigator.mediaDevices.getUserMedia()`.
  - Se o acesso for concedido, o feed da câmera é exibido no elemento `<video>`.
  - Se ocorrer um erro, uma mensagem de alerta é exibida.

- **`pararCamera()`**:
  - Interrompe o feed da câmera e libera o recurso.

- **`triggerSnapshot()`**:
  - Captura um quadro do feed da câmera e o desenha em um `<canvas>`.
  - Converte a imagem do canvas para o formato base64 (`image/jpeg`).
  - Armazena a imagem no `signal` `selectedImage`.
  - Para a câmera.
  - Chama o método `detectFace()` para iniciar a detecção de faces.

- **`detectFace()`**:
  - Extrai os dados da imagem em base64.
  - Converte a imagem de base64 para um `Blob`.
  - Chama o método `detectFace()` do serviço `FaceApiService`, passando o `Blob` da imagem.
  - Se a detecção for bem-sucedida, o resultado é armazenado no `signal` `detectionResult`.
  - Se ocorrer um erro, uma mensagem de alerta é exibida.
