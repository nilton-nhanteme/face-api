import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LivenessCameraComponent } from '../face-liveness/liveness-camera-component';

@Component({
  selector: 'app-detect-face',
  standalone: true,
  imports: [CommonModule, LivenessCameraComponent],
  templateUrl: './detect-face.html',
  styleUrls: ['./detect-face.css']
})
export class DetectFace {
  public isLivenessActive = signal(false);
  public sessionId = signal<string | null>(null);
  public isLoading = signal(false);
  public detectionResult = signal<any>(null);
  public s3Key = signal<string | null>(null);
  public faceId = signal<string | null>(null);
  public livenessConfidence = signal<number | null>(null);
  public error = signal<string | null>(null);

  async iniciarLiveness() {
    this.detectionResult.set(null);
    this.s3Key.set(null);
    this.error.set(null);
    this.livenessConfidence.set(null);
    this.isLoading.set(true);

    try {
      const res = await fetch('/api/create-liveness-session');
      const data = await res.json();
      if (!data.sessionId) throw new Error('Sessão não retornou ID.');
      this.sessionId.set(data.sessionId);
      this.isLivenessActive.set(true);
    } catch (err: any) {
      this.error.set('Erro ao iniciar sessão de liveness: ' + (err.message || err));
    } finally {
      this.isLoading.set(false);
    }
  }

  async onLivenessComplete() {
    this.isLivenessActive.set(false);
    this.isLoading.set(true);

    try {
      const res = await fetch('/api/detect-face-liveness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido.');

      this.livenessConfidence.set(data.livenessConfidence);
      this.s3Key.set(data.s3Key);
      this.faceId.set(data.faceId ?? null);
      this.detectionResult.set(data.faceDetails);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  onLivenessError(err: any) {
    this.isLivenessActive.set(false);
    if (err?.type === 'USER_CANCELLED') return;
    this.error.set('Erro durante o liveness: ' + (err.message || 'Tente novamente.'));
  }

  onLivenessCancel() {
    this.isLivenessActive.set(false);
    this.sessionId.set(null);
    this.isLoading.set(false);
  }

      reiniciar() {
    this.detectionResult.set(null);
    this.s3Key.set(null);
    this.faceId.set(null);
    this.error.set(null);
    this.livenessConfidence.set(null);
    this.sessionId.set(null);
  }
}
