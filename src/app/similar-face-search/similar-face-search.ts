import { CommonModule } from '@angular/common';
import { Component, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FaceApiService } from '../services/face-api';

@Component({
  selector: 'app-similar-face-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './similar-face-search.html',
  styleUrl: './similar-face-search.css',
})
export class SimilarFaceSearch implements OnDestroy {
  public createCollectionId = '';
  public activeCollectionId = '';
  public faceMatchThreshold = 80;
  public maxFaces = 5;
  public availableCollections = signal<string[]>([]);
  public loadingCollections = signal(false);

  private indexFiles: File[] = [];
  private queryFile: File | null = null;

  public indexPreviews = signal<Array<{ name: string; url: string }>>([]);
  public queryPreview = signal<string | null>(null);

  public createCollectionLoading = signal(false);
  public indexFaceLoading = signal(false);
  public searchLoading = signal(false);

  public createCollectionStatus = signal<string | null>(null);
  public indexStatus = signal<string | null>(null);
  public searchError = signal<string | null>(null);

  public searchResult = signal<any | null>(null);

  constructor(private faceApiService: FaceApiService) {}

  ngOnInit(): void {
    this.loadCollections();
  }

  ngOnDestroy(): void {
    this.revokePreviews();
  }

  createCollection(): void {
    const value = this.createCollectionId.trim() || this.generateCollectionId();

    this.createCollectionLoading.set(true);
    this.createCollectionStatus.set(null);

    this.faceApiService.createCollection(value).subscribe({
      next: () => {
        this.activeCollectionId = value;
        this.createCollectionId = value;
        this.createCollectionStatus.set(`Colecao '${value}' criada com sucesso.`);
        this.createCollectionLoading.set(false);
        this.loadCollections();
      },
      error: (err: any) => {
        this.createCollectionStatus.set(err?.error?.error || 'Erro ao criar colecao.');
        this.createCollectionLoading.set(false);
      },
    });
  }

  onIndexFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFiles = input.files;

    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    this.revokeIndexPreview();

    this.indexFiles = Array.from(selectedFiles);
    this.indexPreviews.set(
      this.indexFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    );
    this.indexStatus.set(null);
  }

  indexFace(): void {
    const collection = this.activeCollectionId.trim();

    if (!collection || this.indexFiles.length === 0) {
      this.indexStatus.set('Selecione uma colecao e pelo menos uma imagem.');
      return;
    }

    this.indexFaceLoading.set(true);
    this.indexStatus.set(null);

    const requests = this.indexFiles.map((file, index) => {
      const externalImageId = this.generateExternalImageId(file, index);
      return this.faceApiService.indexFaceInCollection(file, collection, externalImageId);
    });

    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        const totalIndexed = results.reduce((sum, result) => {
          const indexed = result?.FaceRecords?.length ?? result?.indexedFaces?.length ?? 0;
          return sum + indexed;
        }, 0);

        this.indexStatus.set(
          `${results.length} imagem(ns) processada(s). Faces indexadas com sucesso: ${totalIndexed}.`,
        );
        this.indexFaceLoading.set(false);
      },
      error: (err: any) => {
        this.indexStatus.set(err?.error?.error || 'Erro ao indexar imagens no cofre.');
        this.indexFaceLoading.set(false);
      },
    });
  }

  onQueryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.revokeQueryPreview();
    this.queryFile = file;
    this.queryPreview.set(URL.createObjectURL(file));
    this.searchError.set(null);
    this.searchResult.set(null);
  }

  searchSimilarFaces(): void {
    const collection = this.activeCollectionId.trim();
    if (!collection || !this.queryFile) {
      this.searchError.set('Selecione uma colecao e uma imagem para busca.');
      return;
    }

    this.searchLoading.set(true);
    this.searchError.set(null);
    this.searchResult.set(null);

    this.faceApiService
      .searchSimilarFaces(this.queryFile, collection, this.faceMatchThreshold, this.maxFaces)
      .subscribe({
      next: (result: any) => {
        const normalizedMatches = (result?.faceMatches ?? result?.FaceMatches ?? []).map((match: any) => {
          if (match?.Face) {
            return {
              faceId: match.Face.FaceId,
              externalImageId: match.Face.ExternalImageId,
              similarity: match.Similarity,
              confidence: match.Face.Confidence,
            };
          }

          return match;
        });

        this.searchResult.set({
          ...result,
          faceMatches: normalizedMatches,
        });
        this.searchLoading.set(false);
      },
      error: (err: any) => {
        this.searchError.set(err?.error?.error || 'Erro ao buscar faces similares.');
        this.searchLoading.set(false);
      },
      });
  }

  private revokeIndexPreview(): void {
    this.indexPreviews().forEach((preview) => URL.revokeObjectURL(preview.url));
    this.indexPreviews.set([]);
  }

  private revokeQueryPreview(): void {
    const current = this.queryPreview();
    if (current) {
      URL.revokeObjectURL(current);
    }
  }

  private revokePreviews(): void {
    this.revokeIndexPreview();
    this.revokeQueryPreview();
  }

  private generateExternalImageId(file: File, index: number): string {
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);

    return `${sanitizedName}_${Date.now()}_${index}`;
  }

  refreshCollections(): void {
    this.loadCollections();
  }

  private generateCollectionId(): string {
    const iso = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    return `faces-${iso}`;
  }

  private loadCollections(): void {
    this.loadingCollections.set(true);
    this.faceApiService.listCollections().subscribe({
      next: (response: any) => {
        const collections = response?.collectionIds ?? [];
        this.availableCollections.set(collections);

        if (collections.length > 0) {
          if (!this.activeCollectionId || !collections.includes(this.activeCollectionId)) {
            this.activeCollectionId = collections[0];
          }
        }

        this.loadingCollections.set(false);
      },
      error: () => {
        this.availableCollections.set([]);
        this.loadingCollections.set(false);
      },
    });
  }
}
