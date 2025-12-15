FROM python:3.10-slim

RUN apt-get update \
    && apt-get install -y wget gnupg2 tzdata --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --fix-missing google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 设置时区为东八区（上海）
ENV TZ=Asia/Shanghai

RUN pip install pyppeteer
RUN pip install psycopg2-binary
RUN pip install qq_botpy

WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app/cache

CMD ["python", "main.py"]