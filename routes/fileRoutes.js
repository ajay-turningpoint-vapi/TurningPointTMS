const express = require('express');
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

const router = express.Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key: (req, file, cb) => {
            const fileExtension = path.extname(file.originalname);
            const fileName = uuidv4() + fileExtension;
            cb(null, fileName);
        },
    }),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB limit
    },
});

const cloudFrontDomain = "https://d1m2dthq0rpgme.cloudfront.net";

router.post("/upload", upload.array("images"), (req, res) => {
    if (req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    const fileUrls = req.files.map((file) => `${cloudFrontDomain}/${file.key}`);
    res.status(200).json(fileUrls);
});

module.exports = router;
