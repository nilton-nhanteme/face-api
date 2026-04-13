import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaceApiService } from '../services/face-api';
import { LivenessCameraComponent } from '../face-liveness/liveness-camera-component';

@Component({
  selector: 'app-verify-face',
  standalone: true,
  imports: [CommonModule, LivenessCameraComponent],
  templateUrl: './verify-face.html',
  styleUrl: './verify-face.css',
})
export class VerifyFace {
  sourceFile: File | null = null;
  targetFile: File | null = null;
  
  public sourcePreview = signal<string | null>(null);
  public targetPreview = signal<string | null>(null);
  public sourceFileName = signal<string>('Nenhum arquivo selecionado');
  public targetFileName = signal<string>('Nenhum arquivo selecionado');

  public verifyResult = signal<any>(null);
  public error = signal<string | null>(null);
  public isLoading = signal(false);

  //Váriaveis de estado para o componente de liveness
  public isLivenessActive = signal(false);
  public sessionId = signal<string | null>(null);

  constructor(private faceApiService: FaceApiService) {}

  //Chama o backend para pegar o sessionId necessário para iniciar o componente de liveness (camera)
  startLiveness() {
    this.isLoading.set(true);
    this.error.set(null);

    fetch('/api/create-liveness-session')
      .then(res => res.json())
      .then(data => {
        if (data.sessionId) {
          this.sessionId.set(data.sessionId);
          this.isLivenessActive.set(true); //Exibe o componente de liveness (camera)
        }
      })
      .catch(err => {
        this.error.set('Erro ao iniciar sessão de liveness. ' + (err.message || 'Tente novamente.'));
      })
      .finally(() => this.isLoading.set(false));
  }

  // Adicione esta função auxiliar caso você ainda não tenha uma para converter File em Base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove o prefixo "data:image/jpeg;base64," para enviar apenas o conteúdo para o Node
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  }

  async onLivenessComplete() {
    console.log('Captura ao vivo concluída pela interface! Enviando para análise...');
    this.isLivenessActive.set(false); // Esconde a câmera
    this.isLoading.set(true); // Mostra o spinner

    try {
      if (!this.targetFile) {
        throw new Error('A segunda imagem não foi selecionada.');
      }

      // 1. Converte a imagem alvo
      const targetBase64 = await this.fileToBase64(this.targetFile);

      // 2. Chama a nova rota
      const response = await fetch('/api/verify-liveness-and-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId(),
          targetImageBase64: targetBase64
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      console.log('Sucesso Total! Resultado Liveness e Compare:', data);
      
      // 3. Atualiza a tela (Como devolvemos "FaceMatches", a sua tela atual já vai renderizar a barra verde de %!)
      this.verifyResult.set(data);

    } catch (err: any) {
      this.error.set('Erro na validação: ' + err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  onLivenessError(err: any) {
    console.error('Erro no liveness: ', err);
    this.error.set('Erro durante o processo de liveness. ' + (err.message || 'Tente novamente.'));
    this.isLivenessActive.set(false);
  }

  ngOnDestroy(): void {
    this.revokePreviews();
  }

  onSourceFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.revokeSourcePreview();
      this.sourceFile = file;
      this.sourcePreview.set(URL.createObjectURL(file));
      this.sourceFileName.set(file.name);
      this.verifyResult.set(null);
      this.error.set(null);
    }
  }

  onTargetFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.revokeTargetPreview();
      this.targetFile = file;
      this.targetPreview.set(URL.createObjectURL(file));
      this.targetFileName.set(file.name);
      this.verifyResult.set(null);
      this.error.set(null);
    }
  }

  verifyFace() {
    if (!this.sourceFile || !this.targetFile) {
      this.error.set('Por favor, selecione as duas imagens para verificação.');
      return;
    }
    
    console.log('Iniciando verificação...');
    this.error.set(null);
    this.verifyResult.set(null);
    this.isLoading.set(true);

    this.faceApiService.verifyFace(this.sourceFile, this.targetFile).subscribe({
      next: (result) => {
        console.log('Resultado recebido: ', result);
        this.verifyResult.set(result);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao verificar face: ', err);
        this.error.set('Erro na verificação. ' + (err.message || 'Tente novamente.'));
        this.isLoading.set(false);
      }
    });
  }

  private revokeSourcePreview() {
    const current = this.sourcePreview();
    if (current) {
      URL.revokeObjectURL(current);
    }
  }

  private revokeTargetPreview() {
    const current = this.targetPreview();
    if (current) {
      URL.revokeObjectURL(current);
    }
  }

  private revokePreviews() {
    this.revokeSourcePreview();
    this.revokeTargetPreview();
  }
}
