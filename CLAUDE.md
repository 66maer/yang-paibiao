# 项目长期记忆

## 重要规则

- **永远不要直接写 SQL 执行数据库结构变更（DDL）**，必须使用 alembic 迁移工具
- 数据库迁移命令：在 `backend/` 目录下运行 `alembic upgrade head`
- 迁移文件在 `backend/alembic/versions/` 下
- 只有查询（SELECT）和查看表结构可以直接用 SQL

## 数据库操作

### 查询数据库
```bash
docker exec -i shared-postgres psql -U yangpaibiao_user -d yangpaibiao
```

### 查看表结构
```bash
docker exec -i shared-postgres psql -U yangpaibiao_user -d yangpaibiao -c "\d <table_name>"
```

### 执行 SQL 查询
```bash
docker exec -i shared-postgres psql -U yangpaibiao_user -d yangpaibiao -c "<SQL_QUERY>"
```
