const mongoose = require("mongoose");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { Readable } = require("stream");

const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

let _bucket = null;

function getBucket() {
    if (_bucket) return _bucket;
    if (mongoose.connection.readyState !== 1) throw new Error("Mongoose non connecte.");
    _bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.getClient().db(), {
        bucketName: "uploads",
    });
    return _bucket;
}

function uploadToGridFS(buffer, originalName, mimetype) {
    return new Promise((resolve, reject) => {
        const bucket = getBucket();
        crypto.randomBytes(16, (err, buf) => {
            if (err) return reject(err);
            const filename = buf.toString("hex") + path.extname(originalName);
            const readable = new Readable();
            readable.push(buffer);
            readable.push(null);
            const uploadStream = bucket.openUploadStream(filename, {
                contentType: mimetype,
                metadata: { originalName, mimetype },
            });
            readable.pipe(uploadStream)
                .on("error", reject)
                .on("finish", function () {
                    resolve({ id: uploadStream.id, filename, size: uploadStream.length });
                });
        });
    });
}

function upload(field) {
    return (req, res, next) => {
        uploadMiddleware.single(field)(req, res, async (err) => {
            if (err) return next(err);
            if (!req.file) return next();
            try {
                const { id, filename } = await uploadToGridFS(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                );
                req.file.id = id;
                req.file.filename = filename;
                req.file.size = req.file.buffer.length;
                delete req.file.buffer;
                next();
            } catch (e) {
                next(e);
            }
        });
    };
}

module.exports = { upload, getBucket, uploadToGridFS };
