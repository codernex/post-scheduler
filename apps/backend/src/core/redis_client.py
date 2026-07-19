import redis.asyncio as redis
from core.config import settings

# Initialize redis client with connection pool and string decoding
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
