FROM jupyterhub/jupyterhub:latest

# Install dependencies
RUN pip install --no-cache-dir dockerspawner

# Install curl for healthcheck
RUN apt-get update && \
  apt-get install -y curl && \
  rm -rf /var/lib/apt/lists/*

# Create necessary directories with proper permissions
RUN mkdir -p /srv/jupyterhub/data && \
  chmod 777 /srv/jupyterhub/data

# Set working directory
WORKDIR /srv/jupyterhub

# Copy configuration files
COPY jupyterhub_config.py /srv/jupyterhub/jupyterhub_config.py

CMD ["jupyterhub", "-f", "/srv/jupyterhub/jupyterhub_config.py"]

