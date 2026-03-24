import { config } from 'dotenv';

config();

export const environment = {
  production: true,
  region: process.env['REGION'],
  access_key_id: process.env['ACCESS_KEY_ID'],
  secret_access_key: process.env['SECRET_ACCESS_KEY']
};
