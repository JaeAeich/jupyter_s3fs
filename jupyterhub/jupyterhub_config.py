import os
import logging

from jupyterhub.auth import DummyAuthenticator
from dockerspawner import DockerSpawner

# Initialize Logger
logger = logging.getLogger(__name__)

# Retrieve JupyterHub Configuration Object
c = get_config()  # noqa: F821 # type: ignore

# ---------------------------
# 3. Custom Authenticator
# ---------------------------


# ---------------------------
# 4. JupyterHub Authentication Configuration
# ---------------------------

# Allow all users (authentication is handled by the custom Authenticator)
# This is necessary since we are auto logging and not showing the login page
c.JupyterHub.Authenticator.allow_all = True

# Set the custom Authenticator class
c.JupyterHub.authenticator_class = DummyAuthenticator

# ---------------------------
# 5. DockerSpawner Configuration
# ---------------------------

# Use DockerSpawner to spawn user environments
c.JupyterHub.spawner_class = DockerSpawner

# Specify the Docker image to use for user containers
# c.DockerSpawner.image = 'jupyter/datascience-notebook:latest'
# Change the image to use your s3fs-enabled image
c.DockerSpawner.image = 'jaeaeich/datascience-notebook-s3fs:latest'

# Add required environment variables for s3fs mounting
c.DockerSpawner.environment = {
    'MINIO_ENDPOINT': 'http://minio:9000',
    'MINIO_ACCESS_KEY': 'minio',
    'MINIO_SECRET_KEY': 'minio123',
    'BUCKET_NAME': 'datasets'
}

# Add necessary volume mounts and device configurations
c.DockerSpawner.volumes = {
    'jupyter-user-{username}': '/home/jovyan/work',
    '/dev/fuse': '/dev/fuse:rw',
}

# Add required container configurations for FUSE
c.DockerSpawner.extra_host_config = {
    'cap_add': ['SYS_ADMIN'],
    'security_opt': ['apparmor:unconfined'],
    'devices': ['/dev/fuse'],
    'privileged': True,
}

# Networking settings for DockerSpawner
c.DockerSpawner.use_internal_ip = True
c.DockerSpawner.network_name = 'private'

# Mount user-specific volumes from the host to the container
c.DockerSpawner.volumes = {
    'jupyter-user-{username}': '/home/jovyan/work',
}

# Set resource limits for user containers
c.DockerSpawner.mem_limit = '4G'        # Maximum memory limit
c.DockerSpawner.mem_guarantee = '1G'    # Guaranteed memory
c.DockerSpawner.cpu_limit = 2.0         # Maximum CPU cores
c.DockerSpawner.cpu_guarantee = 0.5     # Guaranteed CPU cores

# Define the notebook directory inside the container
c.DockerSpawner.notebook_dir = '/home/jovyan/work'

# Remove containers upon user logout
c.DockerSpawner.remove = True

# Ensure JupyterHub shuts down when all users have logged out
c.JupyterHub.shutdown_on_logout = True

# ---------------------------
# 6. Networking Configuration
# ---------------------------

# Set the internal IP address for the JupyterHub hub
c.JupyterHub.hub_ip = '0.0.0.0'

# Define the base URL path for JupyterHub
c.JupyterHub.base_url = '/jupyter'

# Set HTTP timeout for spawners
c.Spawner.http_timeout = 300  # in seconds

# ---------------------------
# 7. Logging Configuration
# ---------------------------

# Set the logging level for JupyterHub
c.JupyterHub.log_level = 'DEBUG'

# Enable debug mode for DockerSpawner
c.DockerSpawner.debug = True

