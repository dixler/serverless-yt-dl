import * as aws from "aws-sdk";
import * as ytdl from 'ytdl-core';
import {IHandlerArgs} from '.';
import * as zlib from 'zlib';


const b64encode = (str: string) => {
    return Buffer.from(str).toString('base64');
}
export const handler = (event: IHandlerArgs, bucketName: string) => {
    const videoUrl = event.url;
    ytdl.getBasicInfo(videoUrl)
    .then((info) => {
        const body = ytdl(event.url).pipe(zlib.createGzip());
        const client = new aws.S3({
            region: "us-east-1",
        })
        client.upload({
            Bucket: bucketName,
            Key: `${b64encode(videoUrl)}.gz`,
            Body: body,
            Metadata: {
                title: b64encode(info.title),
                description: b64encode(info.description),
                thumbnail_url: b64encode(info.thumbnail_url),
            }
        })
        .on('httpUploadProgress', (evt) => { 
            console.log(evt);
        })
        .send((err: any, data: any) => {
            console.log(err, data)
        });
    });
}
