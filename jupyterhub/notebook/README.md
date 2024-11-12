# Notebook

The notebook image and configuration for Jupyter notebook instances used in
this platform. Each notebook instance is configured to:

- Wait for the MinIO service to become available.
- Mount an S3-compatible bucket (MinIO) as a filesystem within the notebook
  environment, allowing seamless access to files.
- Configure Jupyter to use the mounted directory as its root notebook directory.

This setup allows users to interact with files from the object store directly
within their Jupyter notebooks.
