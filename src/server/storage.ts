import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "~/env";

export const storageClient = new S3Client({
  region: env.R2_REGION,
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export const storageBucket = env.R2_BUCKET;

export async function uploadObject(input: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  await storageClient.send(
    new PutObjectCommand({
      Bucket: storageBucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
}

export async function createSignedDownloadUrl(input: {
  key: string;
  expiresIn?: number;
}) {
  return getSignedUrl(
    storageClient,
    new GetObjectCommand({
      Bucket: storageBucket,
      Key: input.key,
    }),
    { expiresIn: input.expiresIn ?? 60 * 30 },
  );
}

export async function deleteObject(key: string) {
  await storageClient.send(
    new DeleteObjectCommand({
      Bucket: storageBucket,
      Key: key,
    }),
  );
}
