# Dockerfile (Django/Dockerfile)
FROM python:3.9-slim

# Ngăn không ghi bytecode và đảm bảo log luôn flush
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=backend_api.settings

WORKDIR /app

RUN apt-get update && apt-get install -y gcc python3-dev

COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt


COPY . /app/

EXPOSE 8000

#khi nào chạy production thì sử dụng daphne (tạm tắt websocket)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend_api.asgi:application"]
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]