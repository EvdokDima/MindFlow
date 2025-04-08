from botocore.client import Config
import boto3
import os

s3 = boto3.client(
    's3',
    endpoint_url=os.getenv('S3_API_ENDPOINT'),
    aws_access_key_id=os.getenv('ACCESS_KEY_S3'),
    aws_secret_access_key=os.getenv('SECRET_ACCESS_KEY_S3'),
    config=Config(signature_version='s3v4'),
    verify=False
)
def list_task_files_with_urls_from_s3(task_id: str) -> list[dict]:
    try:
        response = s3.list_objects_v2(
            Bucket="mindeasy",
            Prefix=f"{task_id}/"
        )
        contents = response.get("Contents", [])

        result = []
        for obj in contents:
            key = obj["Key"]
            url = s3.generate_presigned_url(
                ClientMethod='get_object',
                Params={
                    'Bucket': 'mindeasy',
                    'Key': key,
                    'ResponseContentDisposition': f'attachment; filename="{key.split("/")[-1]}"'
                },
                ExpiresIn=3600  # ссылка активна 1 час
            )
            result.append({
                "file_name": key.split("/")[-1],
                "s3_key": key,
                "download_url": url
            })

        return result
    except Exception as e:
        raise Exception(f"Ошибка при получении файлов задачи: {str(e)}")
