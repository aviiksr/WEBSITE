const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');

let s3Client = null;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key') {
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

const uploadToS3 = async (file) => {
  if (!s3Client) return null; // Fallback to local storage if no S3 configured
  const fileStream = fs.createReadStream(file.path);
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: file.filename,
    Body: fileStream,
    ContentType: file.mimetype,
  };
  await s3Client.send(new PutObjectCommand(uploadParams));
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.filename}`;
};

const deleteFromS3 = async (filename) => {
  if (!s3Client) return null;
  const deleteParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: filename,
  };
  await s3Client.send(new DeleteObjectCommand(deleteParams));
  return true;
};

const getS3SignedUrl = async (filename, originalName = null) => {
  if (!s3Client) return null;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: filename,
  };
  
  if (originalName) {
    // Force download by setting Content-Disposition
    params.ResponseContentDisposition = `attachment; filename="${originalName}"`;
  }

  const command = new GetObjectCommand(params);
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

module.exports = { uploadToS3, deleteFromS3, getS3SignedUrl };
