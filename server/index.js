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
const MINIO_PORT = process.env.MINIO_PORT
	? parseInt(process.env.MINIO_PORT)
	: 9000;
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME || 'datasets';

// Validate required environment variables
if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
	console.error('Missing required MinIO environment variables!');
	process.exit(1);
}

// Initialize MinIO client
const minioClient = new Minio.Client({
	endPoint: MINIO_ENDPOINT,
	port: MINIO_PORT,
	useSSL: MINIO_USE_SSL,
	accessKey: MINIO_ACCESS_KEY,
	secretKey: MINIO_SECRET_KEY,
});

app.get('/health', (req, res) => {
	res.send('Server is healthy!');
});

// Helper function to check if object exists
async function objectExists(bucketName, objectName) {
	try {
		await minioClient.statObject(bucketName, objectName);
		return true;
	} catch (err) {
		if (err.code === 'NotFound') return false;
		throw err;
	}
}

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' });
		}

		const { workflowId, taskId } = req.body;
		if (!workflowId || !taskId) {
			return res
				.status(400)
				.json({ error: 'Workflow ID and Task ID are required' });
		}

		const bucketName = BUCKET_NAME;
		const objectPath = `${workflowId}/${taskId}/${req.file.originalname}`;

		// Check if file already exists
		const exists = await objectExists(bucketName, objectPath);
		if (exists) {
			return res.status(409).json({
				error: 'File already exists in this path',
				path: objectPath,
			});
		}

		const fileBuffer = req.file.buffer;
		const metaData = {
			'Content-Type': req.file.mimetype,
			'workflow-id': workflowId,
			'task-id': taskId,
		};

		// Upload to MinIO
		await minioClient.putObject(bucketName, objectPath, fileBuffer, metaData);

		res.json({
			message: 'File uploaded successfully',
			path: objectPath,
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
		let streamError = null;

		stream.on('data', (obj) => {
			// Store object info immediately without waiting for stats
			const pathParts = obj.name.split('/');
			const fileName = pathParts.pop();
			const taskId = pathParts.pop();
			const workflowId = pathParts.pop();

			files.push({
				name: fileName,
				fullPath: obj.name,
				size: obj.size,
				lastModified: obj.lastModified,
				workflowId,
				taskId,
			});
		});

		stream.on('error', (err) => {
			console.error('Stream error:', err);
			streamError = err;
		});

		// Wait for stream to complete
		await new Promise((resolve) => {
			stream.on('end', resolve);
		});

		if (streamError) {
			throw streamError;
		}

		// Get metadata for all files in parallel
		const filesWithMetadata = await Promise.all(
			files.map(async (file) => {
				try {
					const stat = await minioClient.statObject(bucketName, file.fullPath);
					return {
						...file,
						metadata: stat.metaData,
					};
				} catch (err) {
					console.warn(`Failed to get metadata for ${file.fullPath}:`, err);
					return file; // Return file without metadata if stat fails
				}
			})
		);

		console.log(`Successfully retrieved ${filesWithMetadata.length} files`);
		res.json(filesWithMetadata);
	} catch (error) {
		console.error('Error listing files:', error);
		res.status(500).json({
			error: 'Error listing files',
			details: error.message,
		});
	}
});

const PORT = 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
