import { Routes } from '@angular/router';
import { VerifyFace } from './verify-face/verify-face';
import { DetectFace } from './detect-face/detect-face';
import { SimilarFaceSearch } from './similar-face-search';

export const routes: Routes = [
  { path: '', redirectTo: '/detect-face', pathMatch: 'full' },
  { path: 'detect-face', component: DetectFace },
  { path: 'verify-face', component: VerifyFace },
  { path: 'similar-face-search', component: SimilarFaceSearch },
];
