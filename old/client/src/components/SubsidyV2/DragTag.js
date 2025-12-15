import { useState, useEffect } from "react";
import { Input, InputNumber } from "antd";

const DragTag = ({
  tag,
  mode = "edit", // "edit" or "display"
  onUpdate,
  onDelete,
  onRemoveFromContainer,
  isDragging = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingName, setEditingName] = useState(tag.name);

  // 同步 tag.name 到本地状态
  useEffect(() => {
    setEditingName(tag.name);
  }, [tag.name]);

  // 处理名称编辑开始
  const handleStartEditing = () => {
    setEditingName(tag.name);
    setIsEditing(true);
  };

  // 处理名称编辑完成
  const handleFinishEditing = () => {
    onUpdate({ ...tag, name: editingName });
    setIsEditing(false);
  };

  // 处理名称输入变化
  const handleNameInputChange = (e) => {
    setEditingName(e.target.value);
  };

  // 处理价格变化
  const handlePriceChange = (value) => {
    onUpdate({ ...tag, price: value || 0 });
  };

  // 处理模式切换
  const handleModeToggle = () => {
    onUpdate({ ...tag, isFixed: !tag.isFixed });
  };

  // 拖拽开始
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(tag));
    e.dataTransfer.effectAllowed = "copy";
  };

  // 编辑模式渲染 [名字|价格|⇅|❌]
  const renderEditMode = () => (
    <div
      className="drag-tag edit-mode"
      draggable
      onDragStart={handleDragStart}
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: tag.isFixed ? "#1890ff" : "#fa8c16",
        color: "white",
        borderRadius: "3px",
        padding: "3px 4px",
        margin: "2px",
        cursor: "grab",
        fontSize: "14px",
        userSelect: "none",
        opacity: isDragging ? 0.5 : 1,
        border: "1px solid rgba(255,255,255,0.3)",
      }}
    >
      {/* 名字区域 - 可拖拽和编辑 */}
      <div
        style={{
          minWidth: "40px",
          maxWidth: "60px",
          borderRight: "1px solid rgba(255,255,255,0.3)",
          paddingRight: "3px",
          marginRight: "3px",
        }}
        onClick={handleStartEditing}
      >
        {isEditing ? (
          <Input
            size="small"
            value={editingName}
            onChange={handleNameInputChange}
            onPressEnter={handleFinishEditing}
            onBlur={handleFinishEditing}
            autoFocus
            style={{
              width: "60px",
              fontSize: "12px",
              backgroundColor: "rgba(255,255,255,0.8)",
              color: "#333",
              height: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            style={{
              cursor: "text",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
          >
            {tag.name}
          </span>
        )}
      </div>

      {/* 价格区域 - 可编辑 */}
      <div
        style={{
          width: "45px",
          borderRight: "1px solid rgba(255,255,255,0.3)",
          paddingRight: "3px",
          marginRight: "3px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <InputNumber
          size="small"
          value={tag.price}
          onChange={handlePriceChange}
          min={0}
          step={100}
          variant="borderless"
          style={{
            width: "100%",
            color: "white",
            backgroundColor: "transparent",
            fontSize: "12px",
          }}
          controls={false}
        />
      </div>

      {/* 模式切换按钮 */}
      <div
        style={{
          width: "12px",
          textAlign: "center",
          borderRight: tag.isDeletable ? "1px solid rgba(255,255,255,0.3)" : "none",
          paddingRight: tag.isDeletable ? "3px" : "0",
          marginRight: tag.isDeletable ? "3px" : "0",
          cursor: "pointer",
          fontSize: "14px",
        }}
        onClick={handleModeToggle}
        title={tag.isFixed ? "固定金额模式" : "浮动金额模式"}
      >
        ⇅
      </div>

      {/* 删除按钮 - 仅自定义标签显示 */}
      {tag.isDeletable && (
        <div
          style={{
            width: "12px",
            textAlign: "center",
            cursor: "pointer",
            fontSize: "12px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tag.id);
          }}
          title="删除标签"
        >
          ❌
        </div>
      )}
    </div>
  );

  // 显示模式渲染 [名字|价格]
  const renderDisplayMode = () => (
    <div
      className="drag-tag display-mode"
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: tag.isFixed ? "#1890ff" : "#fa8c16",
        color: "white",
        borderRadius: "3px",
        padding: "2px 6px",
        margin: "1px",
        fontSize: "16px",
        userSelect: "none",
        border: "1px solid rgba(255,255,255,0.3)",
        position: "relative",
        maxWidth: "120px",
        minWidth: "80px",
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* 名字 */}
      <span
        style={{
          marginRight: "3px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "80px",
        }}
      >
        {tag.name}
      </span>

      {/* 分隔符 */}
      <span
        style={{
          opacity: 0.7,
          borderLeft: "1px solid rgba(255,255,255,0.3)",
          paddingLeft: "3px",
          fontSize: "16px",
        }}
      >
        {tag.displayPrice || tag.price}
      </span>

      {/* 悬停显示删除按钮 */}
      {showDelete && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#ff4d4f",
            borderRadius: "50%",
            width: "12px",
            height: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "10px",
            zIndex: 10,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromContainer(tag.id);
          }}
          title="从容器中移除"
        >
          ×
        </div>
      )}
    </div>
  );

  return mode === "edit" ? renderEditMode() : renderDisplayMode();
};

export default DragTag;
