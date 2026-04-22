# Fix: Inconsistência na Detecção do Liveness

## Problema Identificado

O sistema de Liveness da AWS apresentava resultados inconsistentes (às vezes detectava, outras vezes não) devido a três fatores técnicos:

### 1. Iluminação Ativa Insuficiente (Causa Principal)

O AWS Rekognition Liveness usa **Active Prompting** - a tela emite sequências de cores e intensidades diferentes para analisar como a luz rebate em um rosto 3D real versus uma superfície plana (foto, tablet, papel).

**Problema anterior:**
- Container limitado a `max-width: 440px` e `max-height: 85vh`
- Em telas menores ou com zoom, o container ficava ~330x440px
- A luz emitida pela tela era proporcional à área ocupada pelo componente
- **Menos área = menos luz = assinatura luminosa fraca = falha intermitente**

**Analogia:** É como tentar iluminar um rosto com uma lanterna pequena vs. um holofote. A lanterna pequena não fornece dados suficientes para o algoritmo validar que é um objeto 3D.

### 2. Competição de GPU com Backdrop Filter

O `backdrop-filter: blur(12px)` no overlay consumia recursos da GPU durante o teste, competindo com o processamento do vídeo em tempo real.

**Resultado:**
- Queda de framerate
- Frames perdidos ou com baixa qualidade
- Erros intermitentes de "Face not detected"

### 3. Perda de Pixels por Border Radius

O `border-radius: 28px` com `overflow: hidden` cortava literalmente pixels do feed de vídeo nos cantos, reduzindo a área analisável do rosto.

## Solução Implementada

Transformar o liveness em **fullscreen real** durante o teste, removendo todas as restrições visuais:

### Mudanças nos CSS (3 arquivos)

```css
/* ANTES - Modal com restrições */
.liveness-modal-overlay {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);  /* ❌ Consome GPU */
  padding: 1.5rem;              /* ❌ Reduz área */
}

.liveness-camera-container {
  max-width: 440px;             /* ❌ Limita luz ativa */
  max-height: 85vh;             /* ❌ Limita luz ativa */
  aspect-ratio: 3 / 4;          /* ❌ Força proporção */
  border-radius: 28px;          /* ❌ Corta pixels */
  overflow: hidden;             /* ❌ Corta pixels */
  box-shadow: ...;              /* ❌ Efeito visual desnecessário */
}

/* DEPOIS - Fullscreen sem restrições */
.liveness-modal-overlay {
  background: #000;             /* ✅ Fundo preto sólido */
  /* sem backdrop-filter */     /* ✅ GPU livre para vídeo */
  /* sem padding */             /* ✅ Área máxima */
}

.liveness-camera-container {
  width: 100%;                  /* ✅ Tela cheia */
  height: 100%;                 /* ✅ Tela cheia */
  /* sem max-width/height */    /* ✅ SDK controla dimensões */
  /* sem border-radius */       /* ✅ Todos os pixels preservados */
  /* sem overflow:hidden */     /* ✅ Nada é cortado */
}
```

### Mudanças no Componente Angular

```typescript
// ANTES - Estilos que limitavam o container
styles: [`
  .liveness-inline {
    border-radius: 28px;        /* ❌ Corta vídeo */
    overflow: hidden;           /* ❌ Corta vídeo */
  }
  
  ::ng-deep .amplify-liveness {
    border-radius: 28px !important;  /* ❌ Corta vídeo */
    overflow: hidden !important;     /* ❌ Corta vídeo */
  }
`]

// DEPOIS - Container limpo
styles: [`
  .liveness-inline {
    width: 100%;                /* ✅ Ocupa todo espaço */
    height: 100%;               /* ✅ Ocupa todo espaço */
  }
  
  ::ng-deep .amplify-liveness {
    width: 100% !important;     /* ✅ SDK controla */
    height: 100% !important;    /* ✅ SDK controla */
  }
`]
```

## Arquivos Modificados

1. `src/app/verify-face/verify-face.css`
2. `src/app/similar-face-search/similar-face-search.css`
3. `src/app/detect-face/detect-face.css`
4. `src/app/face-liveness/liveness-camera-component.ts`

## Resultado Esperado

- **Iluminação ativa máxima:** Tela cheia = luz suficiente para assinatura luminosa forte
- **Performance otimizada:** GPU dedicada ao processamento de vídeo
- **Resolução máxima:** Todos os pixels do rosto preservados
- **Detecção consistente:** Taxa de sucesso próxima a 100%

## Notas Técnicas

- O SDK da AWS Amplify UI React Liveness gerencia automaticamente o layout interno quando tem espaço total
- O fundo preto sólido (`#000`) é intencional - maximiza contraste para a sequência de cores do Active Prompting
- Os toasts/alertas do SDK mantêm o glassmorphism para legibilidade sobre o vídeo
- A animação `fadeIn` foi mantida para transição suave ao abrir o fullscreen
