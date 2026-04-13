import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: 'us-east-1:4bd13694-009f-4f2f-b836-10b691499bd2',
      allowGuestAccess: true,
    }
  }
})

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
