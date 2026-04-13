# FaceApi

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.3.

## 📚 Documentação do Projeto

Para facilitar a compreensão do sistema, a documentação foi dividida em seções detalhadas localizadas na pasta `docs/`:

- **[Retornos da API (AWS Rekognition)](docs/api-responses.md)**: Detalhes sobre os objetos JSON retornados por cada endpoint.
- **[Servidor Backend](docs/server.md)**: Explicação sobre a arquitetura do servidor Express e o Proxy da AWS.
- **[Lógica da Aplicação](docs/application.md)**: Detalhes sobre o componente principal do Angular e gerenciamento de estado.
- **[Serviço de Face API](docs/face-api.md)**: Explicação sobre como o frontend se comunica com o backend.
- **[Busca de Faces Similares](docs/face-similar-search.md)**: Documentação específica sobre o fluxo de busca e indexação.
- **[Configuração de Permissões IAM](docs/iam-permissions-setup.md)**: Guia completo para configurar permissões do Face Liveness.
- **[Configuração do Cognito Identity Pool](docs/cognito-setup.md)**: Guia de configuração do Cognito para usuários não autenticados.

---

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
