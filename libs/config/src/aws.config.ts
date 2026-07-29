import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3BucketPrivate: process.env.S3_BUCKET_PRIVATE || 'elara-media-private',
  s3BucketPublic: process.env.S3_BUCKET_PUBLIC || 'elara-media-public',
  s3Endpoint: process.env.S3_ENDPOINT,
}));

