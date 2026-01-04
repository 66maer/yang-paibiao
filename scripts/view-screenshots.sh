#!/bin/bash
# 查看 Bot 截图缓存

CACHE_DIR="data/bot/screenshots"

echo "================================"
echo "Bot 截图缓存查看器"
echo "================================"
echo ""

if [ ! -d "$CACHE_DIR" ]; then
    echo "❌ 缓存目录不存在: $CACHE_DIR"
    exit 1
fi

# 统计信息
TOTAL_FILES=$(find "$CACHE_DIR" -name "team_*.png" | wc -l)
TOTAL_SIZE=$(du -sh "$CACHE_DIR" 2>/dev/null | cut -f1)

echo "📊 缓存统计:"
echo "  - 文件数量: $TOTAL_FILES"
echo "  - 总大小: $TOTAL_SIZE"
echo ""

# 列出最近的截图
echo "📸 最近生成的截图 (前 10 个):"
echo ""

find "$CACHE_DIR" -name "team_*.png" -type f -printf "%T@ %p\n" | \
    sort -rn | \
    head -10 | \
    while read timestamp filepath; do
        filename=$(basename "$filepath")
        size=$(du -h "$filepath" | cut -f1)
        date=$(date -d @"${timestamp%.*}" "+%Y-%m-%d %H:%M:%S")
        echo "  [$date] $filename ($size)"
    done

echo ""
echo "💡 提示:"
echo "  - 查看所有截图: ls -lh $CACHE_DIR"
echo "  - 清空缓存: rm -f $CACHE_DIR/team_*.png"
echo "  - 打开目录: cd $CACHE_DIR && ls"
