# 持续集成

我们可以使用 GitHub Actions 来实现持续集成（CI），我们只需要在 GitHub 上发布 Release 即可自动构建镜像并推送至镜像仓库。

首先，我们需要在 [Docker Hub](https://hub.docker.com/)（或者其他平台，如：[GitHub Packages](https://github.com/features/packages)、[阿里云容器镜像服务](https://www.alibabacloud.com/zh/product/container-registry)等）上创建镜像仓库，用于存放镜像。

前往项目仓库的 `Settings` > `Secrets` > `actions` 栏目 `New Repository Secret` 添加构建所需的密钥：

- `DOCKERHUB_USERNAME`: 你的 Docker Hub 用户名
- `DOCKERHUB_TOKEN`: 你的 Docker Hub PAT（[创建方法](https://docs.docker.com/docker-hub/access-tokens/)）

将以下文件添加至**项目目录**下的 `.github/workflows/` 目录下，并将文件中高亮行中的仓库名称替换为你的仓库名称：

```yaml
name: Docker Hub Release

on:
  push:
    tags:
      - "v*"

jobs:
  docker:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v2

      - name: Setup Docker
        uses: docker/setup-buildx-action@v2

      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Generate Tags
        uses: docker/metadata-action@v4
        id: metadata
        with:
          images: |
            {organization}/{repository}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and Publish
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.metadata.outputs.tags }}
          labels: ${{ steps.metadata.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

# 持续部署

在完成发布并构建镜像后，我们可以自动将镜像部署到服务器上。

前往项目仓库的 `Settings` > `Secrets` > `actions` 栏目 `New Repository Secret` 添加部署所需的密钥：

- `DEPLOY_HOST`: 部署服务器的 SSH 地址
- `DEPLOY_USER`: 部署服务器用户名
- `DEPLOY_KEY`: 部署服务器私钥（[创建方法](https://github.com/appleboy/ssh-action#setting-up-a-ssh-key)）
- `DEPLOY_PATH`: 部署服务器上的项目路径

将以下文件添加至**项目目录**下的 `.github/workflows/` 目录下，在构建成功后触发部署：

```yaml
name: Deploy

on:
  workflow_run:
    workflows:
      - Docker Hub Release
    types:
      - completed

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - name: Start Deployment
        uses: bobheadxi/deployments@v1
        id: deployment
        with:
          step: start
          token: ${{ secrets.GITHUB_TOKEN }}
          env: bot

      - name: Run Remote SSH Command
        uses: appleboy/ssh-action@master
        env:
          DEPLOY_PATH: ${{ secrets.DEPLOY_PATH }}
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          envs: DEPLOY_PATH
          script: |
            cd $DEPLOY_PATH
            docker compose up -d --pull always

      - name: update deployment status
        uses: bobheadxi/deployments@v0.6.2
        if: always()
        with:
          step: finish
          token: ${{ secrets.GITHUB_TOKEN }}
          status: ${{ job.status }}
          env: ${{ steps.deployment.outputs.env }}
          deployment_id: ${{ steps.deployment.outputs.deployment_id }}
```

将上一部分的 `docker-compose.yml` 文件以及 `.env.prod` 配置文件添加至 `DEPLOY_PATH` 目录下，并修改 `docker-compose.yml` 文件中的镜像配置，替换为 Docker Hub 的仓库名称：

```yaml
- build: .
+ image: {organization}/{repository}:latest
```
