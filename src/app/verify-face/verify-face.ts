import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaceApiService } from '../services/face-api';

@Component({
  selector: 'app-verify-face',
  standalone: true,
  imports: [CommonModule],
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

  constructor(private faceApiService: FaceApiService) {}

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
