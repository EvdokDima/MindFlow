import boto3
import os
from botocore.client import Config, ClientError

s3 = boto3.client(
    's3',
    endpoint_url=os.getenv('S3_API_ENDPOINT'),
    aws_access_key_id=os.getenv('ACCESS_KEY_S3'),
    aws_secret_access_key=os.getenv('SECRET_ACCESS_KEY_S3'),
    config=Config(signature_version='s3v4'),
    verify=False
)

def delete_file_from_s3(key):
    try:
        s3.delete_object(
            Bucket='mindeasy',
            Key=key
        )
    except ClientError as e:
        print("Error deleting object", e)