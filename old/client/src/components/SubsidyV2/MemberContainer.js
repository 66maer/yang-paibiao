import { useState, useEffect } from "react";
import { Input, Typography } from "antd";
import { EditOutlined } from "@ant-design/icons";
import DragTag from "./DragTag";

const MemberContainer = ({ container, onUpdate, onDelete, onRemoveTag, onDropTag, isHighlighted = false }) => {
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [editingRemark, setEditingRemark] = useState(container.remark || "");

  // 同步 container.remark 到本地状态
  useEffect(() => {
    setEditingRemark(container.remark || "");
  }, [container.remark]);

  // 处理备注编辑开始
  const handleStartEditingRemark = () => {
    setEditingRemark(container.remark || "");
    setIsEditingRemark(true);
  };

  // 处理备注编辑完成
  const handleFinishEditingRemark = () => {
    onUpdate({ ...container, remark: editingRemark });
    setIsEditingRemark(false);
  };

  // 处理备注输入变化
  const handleRemarkInputChange = (e) => {
    setEditingRemark(e.target.value);
  };

  // 计算总补贴金额
  const totalAmount = container.tags.reduce((sum, tag) => {
    return sum + (tag.displayPrice || tag.price);
  }, 0);

  // 拖拽进入
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // 拖拽放下
  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const tagData = JSON.parse(e.dataTransfer.getData("text/plain"));
      onDropTag(container.id, tagData);
    } catch (error) {
      console.error("拖拽数据解析错误:", error);
    }
  };

  return (
    <div
      className="member-container"
      style={{
        position: "relative",
        border: `1px ${isHighlighted ? "dashed #1890ff" : "solid #d9d9d9"}`,
        borderRadius: "6px",
        padding: "16px 8px 20px 8px",
        margin: "4px",
        minHeight: "80px",
        backgroundColor: isHighlighted ? "#f6ffed" : "#fff",
        transition: "all 0.2s ease",
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 顶部边框线上的内容：标号、备注、删除按钮 */}
      <div
        style={{
          position: "absolute",
          top: "-8px",
          left: "4px",
          right: "4px",
          height: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#fff",
          fontSize: "16px",
        }}
      >
        {/* 左侧：标号和备注 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#fff",
            paddingRight: "4px",
          }}
        >
          <span
            style={{
              color: "#1890ff",
              fontWeight: "bold",
              marginRight: "2px",
            }}
          >
            {container.number}
          </span>

          {isEditingRemark ? (
            <Input
              size="small"
              value={editingRemark}
              onChange={handleRemarkInputChange}
              onPressEnter={handleFinishEditingRemark}
              onBlur={handleFinishEditingRemark}
              autoFocus
              style={{
                width: "60px",
                height: "16px",
                fontSize: "16px",
                padding: "0 4px",
              }}
            />
          ) : (
            <span
              style={{
                cursor: "pointer",
                padding: "1px 3px",
                borderRadius: "2px",
                backgroundColor: "#f5f5f5",
                border: "1px solid #d9d9d9",
                fontSize: "16px",
              }}
              onClick={handleStartEditingRemark}
              title="点击编辑备注"
            >
              {container.remark || "备注"}
              <EditOutlined style={{ marginLeft: "2px", fontSize: "8px" }} />
            </span>
          )}
        </div>

        {/* 右侧：删除按钮 */}
        <div style={{ backgroundColor: "#fff", paddingLeft: "4px" }}>
          <span
            style={{
              cursor: "pointer",
              color: "#ff4d4f",
              fontSize: "12px",
              padding: "0 2px",
            }}
            onClick={() => onDelete(container.id)}
            title="删除容器"
          >
            ❌
          </span>
        </div>
      </div>

      {/* 中间标签展示区域 */}
      <div
        style={{
          minHeight: "40px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: "2px",
        }}
      >
        {container.tags.map((tag) => (
          <DragTag
            key={`${container.id}-${tag.id}`}
            tag={tag}
            mode="display"
            onRemoveFromContainer={() => onRemoveTag(container.id, tag.id)}
          />
        ))}

        {container.tags.length === 0 && (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              color: "#bfbfbf",
              padding: "12px 0",
              fontSize: "10px",
            }}
          >
            拖拽标签到此处
          </div>
        )}
      </div>

      {/* 底部边框线上的总金额 */}
      <div
        style={{
          position: "absolute",
          bottom: "-8px",
          right: "8px",
          backgroundColor: "#fff",
          padding: "0 4px",
          fontSize: "11px",
        }}
      >
        <Typography.Text strong style={{ color: "#52c41a" }}>
          【{totalAmount}】
        </Typography.Text>
      </div>
    </div>
  );
};

export default MemberContainer;
