const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

app.use(express.json());

// Retrieve environment variables with defaults
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'minio';
const MINIO_PORT = process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000;
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME || 'datasets';

// Validate required environment variables
if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
    logger.error('Missing required MinIO environment variables!');
    process.exit(1);
}

// Initialize MinIO client
const minioClient = new Minio.Client({
    endPoint: MINIO_ENDPOINT,
    port: MINIO_PORT,
    useSSL: MINIO_USE_SSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY
});

app.get('/health', (req, res) => {
    res.send('Server is healthy!')
})

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const bucketName = BUCKET_NAME;
        const objectName = req.file.originalname;
        const fileBuffer = req.file.buffer;
        const metaData = {
            'Content-Type': req.file.mimetype,
        };

        // Upload to MinIO
        await minioClient.putObject(bucketName, objectName, fileBuffer, metaData);

        res.json({ 
            message: 'File uploaded successfully',
            file: objectName
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Error uploading file' });
    }
});

// List files endpoint
app.get('/files', async (req, res) => {
    try {
        const bucketName = BUCKET_NAME;
        const stream = minioClient.listObjects(bucketName, '', true);
        const files = [];

        await new Promise((resolve, reject) => {
            stream.on('data', (obj) => {
                files.push({
                    name: obj.name,
                    size: obj.size,
                    lastModified: obj.lastModified
                });
            });
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        res.json(files);
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ error: 'Error listing files' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
