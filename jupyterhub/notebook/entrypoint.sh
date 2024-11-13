#!/bin/bash
set -e

# Function for logging
log() {
  echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $@"
}

# Wait for MinIO to be ready
wait_for_minio() {
  log "Waiting for MinIO to be ready..."
  until curl -s "${MINIO_ENDPOINT}/minio/health/live" >/dev/null; do
    log "MinIO is not ready - sleeping 5s"
    sleep 5
  done
  log "MinIO is ready!"
}

setup_s3fs() {
  # Create credentials file
  echo "${MINIO_ACCESS_KEY}:${MINIO_SECRET_KEY}" >"${HOME}/.passwd-s3fs"
  chmod 600 "${HOME}/.passwd-s3fs"
  # Define the specific path to mount
  local specific_path="${BUCKET_NAME}:/${MOUNT_PATH}"

  # Mount the entire bucket
  log "Mounting MinIO bucket..."
  s3fs "${specific_path}" "${MOUNT_TARGET}" \
    -o url="${MINIO_ENDPOINT}" \
    -o use_path_request_style \
    -o passwd_file="${HOME}/.passwd-s3fs" \
    -o nonempty \
    -o allow_other \
    -o dbglevel=info \
    -o endpoint=us-east-1 \
    -o parallel_count=15 \
    -o multipart_size=10 \
    -o umask=0022 ||
    {
      log "Error: S3FS mount failed"
      exit 1
    }
}

# Setup Jupyter configuration
setup_jupyter() {
  # Create Jupyter config if it doesn't exist
  mkdir -p "${HOME}/.jupyter"

  # Configure Jupyter to show MinIO directory
  cat <<EOF >>"${HOME}/.jupyter/jupyter_notebook_config.py"
c.NotebookApp.notebook_dir = '/home/jovyan'
c.NotebookApp.open_browser = False
c.NotebookApp.ip = '0.0.0.0'
EOF
}

main() {
  log "Starting initialization..."

  # Wait for MinIO
  wait_for_minio

  # Setup S3FS
  setup_s3fs

  # Setup Jupyter
  setup_jupyter

  log "Initialization complete. Starting Jupyter..."

  # Execute the CMD (likely start-notebook.sh)
  exec "$@"
}

main "$@"
