import boto3
import os
from io import BytesIO
from botocore.client import Config
from botocore.exceptions import NoCredentialsError, ClientError

s3 = boto3.client(
    's3',
    endpoint_url=os.getenv('S3_API_ENDPOINT'),
    aws_access_key_id=os.getenv('ACCESS_KEY_S3'),
    aws_secret_access_key=os.getenv('SECRET_ACCESS_KEY_S3'),
    config=Config(signature_version='s3'),
    verify=False
)

def upload_file_to_s3(file_bytes, s3_key, content_type='application/octet-stream'):
    """
    Загружает файл в S3 хранилище

    :param file_bytes: Байты файла
    :param s3_key: Ключ в S3 (путь к файлу)
    :param content_type: MIME-тип файла
    :raises: Exception при ошибках загрузки
    """
    try:
        # Используем BytesIO как файлоподобный объект
        with BytesIO(file_bytes) as file_obj:
            s3.upload_fileobj(
                Fileobj=file_obj,
                Bucket="mindeasy",
                Key=s3_key,
                ExtraArgs={'ContentType': content_type}
            )
        return True
    except NoCredentialsError:
        raise Exception("Не найдены учетные данные S3. Проверьте переменные окружения.")
    except ClientError as e:
        raise Exception(f"Ошибка клиента S3: {str(e)}")
    except Exception as e:
        raise Exception(f"Ошибка загрузки файла: {str(e)}")