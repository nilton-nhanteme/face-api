import { Routes } from '@angular/router';
import { VerifyFace } from './verify-face/verify-face';
import { DetectFace } from './detect-face/detect-face';

export const routes: Routes = [
  { path: '', redirectTo: '/detect-face', pathMatch: 'full' },
  { path: 'detect-face', component: DetectFace },
  { path: 'verify-face', component: VerifyFace }
];
