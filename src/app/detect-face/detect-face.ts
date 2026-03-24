import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaceApiService } from '../services/face-api';

@Component({
  selector: 'app-detect-face',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detect-face.html',
  styleUrls: ['./detect-face.css']
})
export class DetectFace {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  public isCameraActive = signal(false);
  public selectedImage = signal<string | null>(null);
  public isLoading = signal(false);
  public detectionResult = signal<any>(null);

  constructor(private faceapi: FaceApiService) {}

  public async iniciarCamera() {
    this.selectedImage.set(null);
    this.detectionResult.set(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      this.isCameraActive.set(true);
      
      // Pequeno delay para garantir que o videoElement está no DOM
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = stream;
        }
      }, 0);
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }

  public pararCamera() {
    if (this.videoElement?.nativeElement.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    this.isCameraActive.set(false);
  }

  public triggerSnapshot() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg');
      this.selectedImage.set(imageData);
      this.pararCamera();
      this.detectFace();
    }
  }

  private detectFace() {
    const base64Data = this.selectedImage()?.split(',')[1];
    if (!base64Data) return;

    this.isLoading.set(true);
    
    fetch(this.selectedImage()!)
      .then(res => res.blob())
      .then(blob => {
        this.faceapi.detectFace(blob).subscribe({
          next: (data) => {
            console.log('Resultado do Rekognition:', data);
            this.detectionResult.set(data);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Erro detalhado na detecção:', err);
            this.isLoading.set(false);
            const errorMessage = err?.message || 'Erro desconhecido';
            alert(`Erro ao processar imagem no AWS Rekognition: ${errorMessage}`);
          }
        });
      });
  }
}
