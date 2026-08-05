import { registerAs } from '@nestjs/config';

export default registerAs('typesense', () => ({
  host: process.env.TYPESENSE_HOST || 'localhost',
  port: parseInt(process.env.TYPESENSE_PORT || '8108', 10),
  apiKey: process.env.TYPESENSE_API_KEY || 'dev_typesense_key',
}));
