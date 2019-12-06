import * as aws from "@pulumi/aws";
import {handler} from "./src/handler";
import {IHandlerArgs} from "./src";

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("ytdl-bucket");

const lambdaRole = new aws.iam.Role(`role-payloads-api`, {
    assumeRolePolicy: {
        Version: "2012-10-17",
        Statement: [
            {
                Action: "sts:AssumeRole",
                Principal: {
                    Service: "lambda.amazonaws.com"
                },
                Effect: "Allow"
            }
        ]
    }
})

const lambda = new aws.lambda.CallbackFunction("ytdl-downloader", {
    role: lambdaRole,
    callback: (event: IHandlerArgs) => {
        handler(event, bucket.id.get());
    }
})

// Policy for allowing Lambda to interact with S3
const lambdaS3Policy = new aws.iam.Policy(`post-to-s3-policy`, {
    description: "IAM policy for Lambda to interact with S3",
    path: "/",
    policy: bucket.arn.apply((bucketArn: string): aws.iam.PolicyDocument => {
        return {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "s3:PutObject", // Very restrictive policy
                    Resource: `${bucketArn}/*`,
                    Effect: "Allow"
                }
            ]
        }
    })
})

new aws.iam.RolePolicyAttachment(`post-to-s3-policy-attachment`, {
    policyArn: lambdaS3Policy.arn,
    role: lambdaRole.name
})

export const lambdaArn = lambda.arn
export const bucketArn = bucket.arn