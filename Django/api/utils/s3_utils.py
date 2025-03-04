import boto3
import logging
import os
from botocore.exceptions import NoCredentialsError, ClientError
from django.conf import settings

logger = logging.getLogger(__name__)

def generate_presigned_url(s3_key, expiration=3600):
    """
    Generate a presigned URL to share an S3 object
    
    :param s3_key: Path to file in S3 bucket (excluding bucket name)
    :param expiration: Time in seconds for the presigned URL to remain valid
    :return: Presigned URL as string. If error, returns None.
    """
    # Get AWS credentials from environment variables or settings
    AWS_ACCESS_KEY = getattr(settings, 'AWS_ACCESS_KEY_ID', os.getenv('AWS_ACCESS_KEY_ID'))
    AWS_SECRET_KEY = getattr(settings, 'AWS_SECRET_ACCESS_KEY', os.getenv('AWS_SECRET_ACCESS_KEY'))
    AWS_STORAGE_BUCKET_NAME = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', os.getenv('AWS_STORAGE_BUCKET_NAME'))
    AWS_S3_REGION_NAME = getattr(settings, 'AWS_S3_REGION_NAME', os.getenv('AWS_S3_REGION_NAME', 'us-east-1'))
    
    if not all([AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_STORAGE_BUCKET_NAME]):
        logger.error("AWS credentials not configured")
        return None
        
    # Create a boto3 client
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            region_name=AWS_S3_REGION_NAME
        )
        
        # Generate the presigned URL
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': AWS_STORAGE_BUCKET_NAME,
                'Key': s3_key,
                'ResponseContentDisposition': f'inline; filename="{os.path.basename(s3_key)}"'
            },
            ExpiresIn=expiration
        )
        
        return response
        
    except NoCredentialsError:
        logger.error("Credentials not available")
    except ClientError as e:
        logger.error(f"S3 client error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    
    return None