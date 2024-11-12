FROM jupyter/datascience-notebook:latest

USER root

# Install s3fs
RUN apt-get update && apt-get install -y \
  s3fs \
  fuse \
  curl \
  iputils-ping \
  && rm -rf /var/lib/apt/lists/*

ENV MOUNT_TARGET="/mnt/s3buckets"

RUN mkdir -p ${MOUNT_TARGET}

# Configure FUSE to allow other users (necessary for s3fs with allow_other)
RUN echo "user_allow_other" >> /etc/fuse.conf

# Copy entrypoint script
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["start-notebook.sh"]
