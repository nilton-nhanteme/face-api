import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FaceApiService {
  private detectUrl = '/api/detect-face';
  private verifyUrl = '/api/verify-face';
  private searchUrl = '/api/search-similar-faces';
  private createCollectionUrl = '/api/admin/create-collection';
  private indexFaceUrl = '/api/admin/index-face';
  private listCollectionsUrl = '/api/admin/collections';

  constructor(private http: HttpClient) {}

  detectFace(blob: Blob): Observable<any> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        this.http.post(this.detectUrl, { imageBase64: base64data })
          .subscribe({
            next: (data) => {
              observer.next(data);
              observer.complete();
            },
            error: (err) => observer.error(err)
          });
      };
      reader.onerror = (err) => observer.error(err);
      reader.readAsDataURL(blob);
    });
  }

  verifyFace(sourceBlob: Blob, targetBlob: Blob): Observable<any> {
    return new Observable(observer => {
      const sourceReader = new FileReader();
      sourceReader.onloadend = () => {
        const sourceBase64 = (sourceReader.result as string).split(',')[1];
        
        const targetReader = new FileReader();
        targetReader.onloadend = () => {
          const targetBase64 = (targetReader.result as string).split(',')[1];
          
          this.http.post(this.verifyUrl, {
            sourceImageBase64: sourceBase64, 
            targetImageBase64: targetBase64 
          }).subscribe({
            next: (data) => {
              observer.next(data);
              observer.complete();
            },
            error: (err) => observer.error(err)
          });
        };
        targetReader.onerror = (err) => observer.error(err);
        targetReader.readAsDataURL(targetBlob);
      };
      sourceReader.onerror = (err) => observer.error(err);
      sourceReader.readAsDataURL(sourceBlob);
    });
  }

  searchSimilarFaces(sourceBlob: Blob, collectionId: string, faceMatchThreshold = 80, maxFaces = 5): Observable<any> {
    return new Observable(observer => {
      const sourceReader = new FileReader();
      sourceReader.onloadend = () => {
        const sourceBase64 = (sourceReader.result as string).split(',')[1];

        this.http.post(this.searchUrl, {
          imageBase64: sourceBase64,
          collectionId,
          faceMatchThreshold,
          maxFaces,
        }).subscribe({
          next: (data) => {
            observer.next(data);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      };
      sourceReader.onerror = (err) => observer.error(err);
      sourceReader.readAsDataURL(sourceBlob);
    });
  }

  createCollection(collectionId: string): Observable<any> {
    return this.http.post(this.createCollectionUrl, { collectionId });
  }

  listCollections(): Observable<any> {
    return this.http.get(this.listCollectionsUrl);
  }

  indexFaceInCollection(imageBlob: Blob, collectionId: string, externalImageId: string): Observable<any> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageBase64 = (reader.result as string).split(',')[1];

        this.http.post(this.indexFaceUrl, {
          collectionId,
          imageBase64,
          externalImageId,
        }).subscribe({
          next: (data) => {
            observer.next(data);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      };
      reader.onerror = (err) => observer.error(err);
      reader.readAsDataURL(imageBlob);
    });
  }
}