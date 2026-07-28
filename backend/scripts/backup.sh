#!/bin/sh
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DUMP_DIR="${BACKUP_DIR}/mongodb_${TIMESTAMP}"
ARCHIVE="${BACKUP_DIR}/mongodb_${TIMESTAMP}.tar.gz"
RETENTION="${RETENTION:-7}"
LOG_FILE="${BACKUP_DIR}/backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# ── 1. mongodump ──────────────────────────────────────────────────────────
log "Starting mongodump → $DUMP_DIR"
if [ -n "$MONGO_URI" ]; then
    mongodump --uri="$MONGO_URI" --out="$DUMP_DIR" --quiet
else
    log "WARNING: MONGO_URI not set, using default localhost:27017"
    mongodump --out="$DUMP_DIR" --quiet
fi

# ── 2. Compress ───────────────────────────────────────────────────────────
log "Compressing → $ARCHIVE"
tar -czf "$ARCHIVE" -C "$BACKUP_DIR" "mongodb_${TIMESTAMP}"
rm -rf "$DUMP_DIR"

# ── 3. Local retention ────────────────────────────────────────────────────
local_count=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
if [ "$local_count" -gt "$RETENTION" ]; then
    ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null \
        | tail -n +$((RETENTION + 1)) \
        | xargs -r rm -f
    log "Local retention: purged $((local_count - RETENTION)) old backup(s)"
fi

# ── 4. Upload to S3-compatible (Backblaze B2) ────────────────────────────
if [ -n "$B2_ENDPOINT" ] && [ -n "$B2_BUCKET" ]; then
    log "Uploading to s3://${B2_BUCKET}/backups/ (${B2_ENDPOINT})"
    aws s3 cp "$ARCHIVE" "s3://${B2_BUCKET}/backups/" \
        --endpoint-url "$B2_ENDPOINT" \
        --only-show-errors

    # ── 5. Remote retention ────────────────────────────────────────────────
    log "Remote retention: keeping last $RETENTION backups"
    aws s3 ls "s3://${B2_BUCKET}/backups/" \
        --endpoint-url "$B2_ENDPOINT" \
        --output text \
        | awk '{print $NF}' \
        | sort \
        | head -n -"$RETENTION" \
        | while IFS= read -r key; do
            if [ -n "$key" ]; then
                aws s3 rm "s3://${B2_BUCKET}/backups/${key}" \
                    --endpoint-url "$B2_ENDPOINT" \
                    --only-show-errors
                log "  deleted remote: $key"
            fi
          done
else
    log "B2_ENDPOINT/B2_BUCKET not set — skipping remote upload"
fi

log "Done: $(du -h "$ARCHIVE" | cut -f1)"
