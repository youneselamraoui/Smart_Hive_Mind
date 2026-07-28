FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    ca-certificates \
    python3 \
    python3-pip \
    cron \
    && rm -rf /var/lib/apt/lists/*

# MongoDB database tools (mongodump)
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
    | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" \
    | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update && apt-get install -y --no-install-recommends mongodb-database-tools \
    && rm -rf /var/lib/apt/lists/*

# AWS CLI (S3-compatible upload)
RUN pip3 install --no-cache-dir awscli

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Cron job: every day at 3:00 AM
RUN echo "0 3 * * * root /usr/local/bin/backup.sh" > /etc/cron.d/backup \
    && chmod 0644 /etc/cron.d/backup

# Touch cron log so the container has a log target
RUN touch /var/log/backup.log

CMD ["cron", "-f"]
