### Documentação do Serviço de Detecção de Faces (`src/app/services/face-api.ts`)

Este serviço é responsável por encapsular a comunicação com a API de backend que, por sua vez, interage com o AWS Rekognition.

#### 1. Metadados do Serviço

```typescript
@Injectable({
  providedIn: 'root'
})
```

- **`@Injectable({ providedIn: 'root' })`**: Este decorador marca a classe como um serviço que pode ser injetado em outros componentes ou serviços. A opção `providedIn: 'root'` significa que o Angular criará uma única instância deste serviço para toda a aplicação.

#### 2. Propriedades do Serviço

- **`private detectUrl = '/api/detect-face'`**: A URL da API de backend para a qual as requisições de detecção de faces serão enviadas.
- **`private verifyUrl = '/api/verify-face'`**: A URL da API de backend para a qual as requisições de comparação de faces serão enviadas.

#### 3. Métodos do Serviço

- **`constructor(private http: HttpClient)`**: Injeta o `HttpClient` do Angular, que é usado para fazer requisições HTTP.

- **`detectFace(blob: Blob): Observable<any>`**:
  - Este método recebe um `Blob` (Binary Large Object) que representa a imagem a ser analisada.
  - Ele retorna um `Observable`, que é um padrão do RxJS para lidar com operações assíncronas.
  - **Lógica interna**:
    1. Um `FileReader` é usado para ler o conteúdo do `Blob` como uma string de dados em base64.
    2. Quando a leitura é concluída (`onloadend`), a string em base64 é extraída.
    3. Uma requisição `POST` é enviada para a `detectUrl` (`/api/detect-face`) usando o `HttpClient`. O corpo da requisição contém um objeto JSON com a propriedade `imageBase64` e o valor da imagem em base64.
    4. O `Observable` retornado pelo `http.post` é "inscrito" (`subscribe`).
       - Se a requisição for bem-sucedida (`next`), os dados retornados pelo backend são emitidos para quem chamou o método `detectFace`.
       - Se ocorrer um erro (`error`), o erro é emitido.

- **`verifyFace(sourceBlob: Blob, targetBlob: Blob): Observable<any>`**:
  - Este método recebe dois `Blobs` que representam a imagem de origem e a imagem de destino para comparação.
  - Ele retorna um `Observable` que emitirá o resultado da comparação.
  - **Lógica interna**:
    1. Dois `FileReaders` são usados para ler os conteúdos dos `Blobs` em base64.
    2. Quando as leituras são concluídas, uma requisição `POST` é enviada para a `verifyUrl` (`/api/verify-face`).
    3. O corpo da requisição contém um objeto JSON com as propriedades `sourceImageBase64` e `targetImageBase64`.
    4. O resultado da comparação retornado pelo backend é emitido através do `Observable`.
