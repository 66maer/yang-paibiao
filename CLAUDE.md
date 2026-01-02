# 项目长期记忆

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
