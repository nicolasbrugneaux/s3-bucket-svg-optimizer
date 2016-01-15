const AWS = require('aws-sdk');
const SVGO = require('svgo');
const dotenv = require('dotenv');

dotenv.load();

const s3 = new AWS.S3({params: {Bucket: process.env.AWS_BUCKET}});

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Missing credentials AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY, add them to your environement variables or to .env file');
}

const svgo = new SVGO({
    plugins: [
        'removeDimensions',
        'removeMetadata',
        'convertPathData',
        'mergePaths',
        'cleanupIDs'
    ],
    full: true
});

s3.listObjects((err, res) => {
    if (err) throw err;

    console.log('Successfully connected to s3 bucket');
    res.Contents && res.Contents.forEach(object => {
        if (!/\.svg$/.test(object.Key)) return;

        s3.getObject({Key: object.Key}, (err, data) => {
            if (err) throw err;

            const before = data.Body.toString();
            svgo.optimize(before, after => {
                const body = new Buffer(after.data);

                const svg = {
                    ContentType: 'image/svg+xml',
                    Body: body,
                    Key: object.Key
                };

                s3.upload(svg, (err, data) => {
                    if (err) throw err;

                    console.log('Uploaded successfully: ' + data.key);
                })
            } )
        })
    })
});
