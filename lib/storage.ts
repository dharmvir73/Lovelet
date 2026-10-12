import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
const client = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    ...(process.env.S3_ENDPOINT
      ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
      : {}),
  });
export async function storePhoto(key: string, data: Buffer) {
  if (process.env.S3_BUCKET) {
    await client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: 'image/jpeg',
      }),
    );
  } else {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_LOCAL_STORAGE !== 'true'
    )
      throw new Error('Object storage is not configured.');
    await mkdir(
      resolve(
        /* turbopackIgnore: true */ process.env.DATA_DIR || '.data',
        'photos',
      ),
      {
        recursive: true,
      },
    );
    await writeFile(
      resolve(
        /* turbopackIgnore: true */ process.env.DATA_DIR || '.data',
        'photos',
        key,
      ),
      data,
    );
  }
}
export async function readPhoto(key: string) {
  if (!/^[a-f0-9]{48}\.jpg$/.test(key)) throw new Error('Invalid image.');
  if (process.env.S3_BUCKET) {
    const r = await client().send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
    return Buffer.from(await r.Body!.transformToByteArray());
  }
  return readFile(
    resolve(
      /* turbopackIgnore: true */ process.env.DATA_DIR || '.data',
      'photos',
      key,
    ),
  );
}
export async function removePhoto(key: string) {
  if (!/^[a-f0-9]{48}\.jpg$/.test(key)) return;
  if (process.env.S3_BUCKET)
    await client().send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
  else
    await unlink(
      resolve(
        /* turbopackIgnore: true */ process.env.DATA_DIR || '.data',
        'photos',
        key,
      ),
    ).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== 'ENOENT') throw e;
    });
}
