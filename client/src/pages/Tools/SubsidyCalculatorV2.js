import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Button, InputNumber, Typography, Space, message } from "antd";
import { PlusOutlined, ReloadOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import DragTag from "@/components/SubsidyV2/DragTag";
import MemberContainer from "@/components/SubsidyV2/MemberContainer";

const { Title, Text } = Typography;

// 标签行组件 - 包含标签和添加到所有容器按钮
const TagWithAddButton = ({ tag, onUpdate, onDelete, onAddToAllContainers }) => {
  const [showAddButton, setShowAddButton] = React.useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "4px",
        padding: "2px",
        borderRadius: "3px",
        transition: "background-color 0.2s",
      }}
      onMouseEnter={() => setShowAddButton(true)}
      onMouseLeave={() => setShowAddButton(false)}
    >
      <div style={{ flex: 1 }}>
        <DragTag tag={tag} mode="edit" onUpdate={onUpdate} onDelete={onDelete} />
      </div>

      {showAddButton && (
        <Button
          type="text"
          size="small"
          style={{
            marginLeft: "8px",
            fontSize: "10px",
            height: "20px",
            padding: "0 6px",
            color: "#1890ff",
            flexShrink: 0
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAddToAllContainers(tag);
          }}
          title="添加到所有容器"
        >
          +全部
        </Button>
      )}
    </div>
  );
};

const SubsidyCalculatorV2 = () => {
  // 默认标签配置（不可删除）
  const DEFAULT_TAGS = [
    { id: "default-1", name: "奶补", price: 1000, isFixed: false, isDeletable: false },
    { id: "default-2", name: "T补", price: 1000, isFixed: false, isDeletable: false },
    { id: "default-3", name: "二十四", price: 1500, isFixed: true, isDeletable: false },
    { id: "default-4", name: "玉笛", price: 1500, isFixed: true, isDeletable: false },
    { id: "default-5", name: "宴席", price: 3000, isFixed: true, isDeletable: false },
    { id: "default-6", name: "鱼", price: 1000, isFixed: true, isDeletable: false },
    { id: "default-7", name: "同泽", price: 500, isFixed: true, isDeletable: false },
  ];

  // 默认容器配置
  const DEFAULT_CONTAINERS = [
    { id: "container-1", number: "1", remark: "奶毒", tags: [DEFAULT_TAGS[0]] },
    { id: "container-2", number: "2", remark: "奶秀", tags: [DEFAULT_TAGS[0]] },
    { id: "container-3", number: "3", remark: "奶花", tags: [DEFAULT_TAGS[0]] },
    { id: "container-4", number: "4", remark: "奶歌", tags: [DEFAULT_TAGS[0]] },
    { id: "container-5", number: "5", remark: "奶药", tags: [DEFAULT_TAGS[0]] },
    { id: "container-6", number: "6", remark: "策T", tags: [DEFAULT_TAGS[1]] },
    { id: "container-7", number: "7", remark: "喵T", tags: [DEFAULT_TAGS[1]] },
    { id: "container-8", number: "8", remark: "和尚T", tags: [DEFAULT_TAGS[1]] },
    { id: "container-9", number: "9", remark: "苍云T", tags: [DEFAULT_TAGS[1]] },
  ];

  // 状态管理
  const [totalAmount, setTotalAmount] = useState(""); // 总金团
  const [maxSubsidy, setMaxSubsidy] = useState(0); // 最大可补贴金额
  const [availableTags, setAvailableTags] = useState([...DEFAULT_TAGS]); // 可用标签
  const [containers, setContainers] = useState([...DEFAULT_CONTAINERS]); // 容器列表
  const [dragOverContainer, setDragOverContainer] = useState(null); // 拖拽悬停的容器
  const [customTagCounter, setCustomTagCounter] = useState(1); // 自定义标签计数器

  // 计算最大可补贴金额
  useEffect(() => {
    if (totalAmount && !isNaN(totalAmount)) {
      setMaxSubsidy(Math.floor(totalAmount * 0.2));
    } else {
      setMaxSubsidy(0);
    }
  }, [totalAmount]);

  // 重新计算补贴金额并更新containers
  const recalculateSubsidies = useCallback(
    (newContainers = containers) => {
      if (!totalAmount || maxSubsidy === 0) {
        // 没有总金团设置，按原价显示
        const updatedContainers = newContainers.map((container) => ({
          ...container,
          tags: container.tags.map((tag) => ({ ...tag, displayPrice: tag.price })),
        }));
        setContainers(updatedContainers);
        return;
      }

      let updatedContainers = JSON.parse(JSON.stringify(newContainers)); // 深拷贝
      let remainingAmount = maxSubsidy;

      // 第一步：计算所有固定金额补贴
      let totalFixedAmount = 0;
      updatedContainers.forEach((container) => {
        container.tags.forEach((tag) => {
          if (tag.isFixed) {
            totalFixedAmount += tag.price;
            tag.displayPrice = tag.price;
          }
        });
      });

      remainingAmount -= totalFixedAmount;

      // 第二步：处理浮动金额补贴
      if (remainingAmount > 0) {
        // 计算所有浮动标签的总价值
        let totalFloatingAmount = 0;
        const floatingTags = [];

        updatedContainers.forEach((container) => {
          container.tags.forEach((tag) => {
            if (!tag.isFixed) {
              totalFloatingAmount += tag.price;
              floatingTags.push(tag);
            }
          });
        });

        if (totalFloatingAmount > 0) {
          if (remainingAmount >= totalFloatingAmount) {
            // 剩余金额足够，按原价补贴
            floatingTags.forEach((tag) => {
              tag.displayPrice = tag.price;
            });
          } else {
            // 剩余金额不够，按比例分配
            const ratio = remainingAmount / totalFloatingAmount;
            floatingTags.forEach((tag) => {
              tag.displayPrice = Math.floor(tag.price * ratio);
            });
          }
        }
      } else {
        // 剩余金额不足，浮动标签为0
        updatedContainers.forEach((container) => {
          container.tags.forEach((tag) => {
            if (!tag.isFixed) {
              tag.displayPrice = 0;
            }
          });
        });
      }

      setContainers(updatedContainers);
    },
    [containers, totalAmount, maxSubsidy]
  );

  // 当总金团变化时重新计算
  useEffect(() => {
    recalculateSubsidies();
  }, [totalAmount, maxSubsidy]);

  // 添加新标签
  const handleAddTag = () => {
    const newTag = {
      id: `custom-${customTagCounter}`,
      name: "新补贴",
      price: 1000,
      isFixed: true,
      isDeletable: true,
    };
    setAvailableTags((prev) => [...prev, newTag]);
    setCustomTagCounter((prev) => prev + 1);
  };

  // 更新标签
  const handleUpdateTag = (updatedTag) => {
    const oldTag = availableTags.find(tag => tag.id === updatedTag.id);
    setAvailableTags((prev) => prev.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag)));

    // 只有当价格或固定/浮动状态改变时，才需要更新容器并重新计算
    const needsRecalculation = !oldTag || oldTag.price !== updatedTag.price || oldTag.isFixed !== updatedTag.isFixed;
    
    if (needsRecalculation) {
      // 同时更新容器中对应的标签
      const newContainers = containers.map((container) => ({
        ...container,
        tags: container.tags.map((tag) => (tag.id === updatedTag.id ? { ...updatedTag } : tag)),
      }));
      recalculateSubsidies(newContainers);
    }
  };

  // 删除标签
  const handleDeleteTag = (tagId) => {
    setAvailableTags((prev) => prev.filter((tag) => tag.id !== tagId));

    // 同时从所有容器中移除该标签
    const newContainers = containers.map((container) => ({
      ...container,
      tags: container.tags.filter((tag) => tag.id !== tagId),
    }));
    recalculateSubsidies(newContainers);
  };

  // 将标签添加到所有容器
  const handleAddTagToAllContainers = (tag) => {
    const newContainers = containers.map((container) => {
      // 检查是否已经存在相同标签
      const existingTag = container.tags.find((t) => t.id === tag.id);
      if (existingTag) {
        return container; // 已存在，不添加
      }
      return {
        ...container,
        tags: [...container.tags, { ...tag }],
      };
    });

    const addedCount = newContainers.reduce((count, container, index) => {
      return count + (container.tags.length > containers[index].tags.length ? 1 : 0);
    }, 0);

    if (addedCount > 0) {
      recalculateSubsidies(newContainers);
      message.success(`已将"${tag.name}"添加到 ${addedCount} 个容器中`);
    } else {
      message.info(`所有容器都已包含"${tag.name}"标签`);
    }
  };

  // 拖拽标签到容器
  const handleDropTagToContainer = (containerId, draggedTag) => {
    const newContainers = containers.map((container) => {
      if (container.id === containerId) {
        // 检查是否已经存在相同标签
        const existingTag = container.tags.find((tag) => tag.id === draggedTag.id);
        if (existingTag) {
          message.warning("该容器已存在此标签");
          return container;
        }
        return {
          ...container,
          tags: [...container.tags, { ...draggedTag }],
        };
      }
      return container;
    });
    recalculateSubsidies(newContainers);
    setDragOverContainer(null);
  };

  // 从容器移除标签
  const handleRemoveTagFromContainer = (containerId, tagId) => {
    const newContainers = containers.map((container) => {
      if (container.id === containerId) {
        return {
          ...container,
          tags: container.tags.filter((tag) => tag.id !== tagId),
        };
      }
      return container;
    });
    recalculateSubsidies(newContainers);
  };

  // 更新容器
  const handleUpdateContainer = (updatedContainer) => {
    const oldContainer = containers.find(container => container.id === updatedContainer.id);
    const newContainers = containers.map((container) =>
      container.id === updatedContainer.id ? updatedContainer : container
    );
    
    // 只有当标签内容发生变化时才需要重新计算，备注变化不需要重新计算
    const needsRecalculation = !oldContainer || 
      JSON.stringify(oldContainer.tags) !== JSON.stringify(updatedContainer.tags);
    
    if (needsRecalculation) {
      recalculateSubsidies(newContainers);
    } else {
      setContainers(newContainers);
    }
  };

  // 删除容器
  const handleDeleteContainer = (containerId) => {
    const newContainers = containers.filter((container) => container.id !== containerId);
    recalculateSubsidies(newContainers);
  };

  // 添加新容器
  const handleAddContainer = () => {
    const newContainerNumber = containers.length + 1;
    const newContainer = {
      id: `container-${Date.now()}`,
      number: newContainerNumber.toString(),
      remark: `成员${newContainerNumber}`,
      tags: [],
    };
    const newContainers = [...containers, newContainer];
    recalculateSubsidies(newContainers);
  };

  // 恢复默认容器配置
  const handleRestoreDefault = () => {
    recalculateSubsidies([...DEFAULT_CONTAINERS]);
    message.success("已恢复默认容器配置");
  };

  // 保存配置到本地存储
  const handleSaveConfig = () => {
    const config = {
      availableTags: availableTags.filter((tag) => tag.isDeletable), // 只保存自定义标签
      customTagCounter,
    };
    localStorage.setItem("subsidy-calculator-v2-config", JSON.stringify(config));
    message.success("配置已保存到本地");
  };

  // 从本地存储加载配置
  const handleLoadConfig = () => {
    try {
      const savedConfig = localStorage.getItem("subsidy-calculator-v2-config");
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setAvailableTags([...DEFAULT_TAGS, ...config.availableTags]);
        setCustomTagCounter(config.customTagCounter || 1);
        message.success("配置已从本地加载");
      } else {
        message.info("未找到已保存的配置");
      }
    } catch (error) {
      message.error("加载配置失败");
    }
  };

  // 计算总补贴金额
  const calculateTotalSubsidy = () => {
    return containers.reduce((total, container) => {
      return (
        total +
        container.tags.reduce((sum, tag) => {
          return sum + (tag.displayPrice || tag.price);
        }, 0)
      );
    }, 0);
  };

  return (
    <div style={{ padding: "12px", height: "100%" }}>
      <div style={{ marginBottom: "12px" }}>
        <Title level={4} style={{ margin: "0 0 8px 0" }}>
          补贴计算器V2
        </Title>

        {/* 第一行：总金团和最大补贴额度 */}
        <Row gutter={[16, 8]} align="middle" style={{ marginBottom: "8px" }}>
          <Col>
            <Text>总金团：</Text>
            <InputNumber
              value={totalAmount}
              onChange={setTotalAmount}
              placeholder="输入总金团"
              style={{ width: "120px" }}
              min={0}
              size="small"
            />
          </Col>
          <Col>
            <Text>最大可补贴金额 20%：</Text>
            <Text strong style={{ color: "#52c41a" }}>
              {maxSubsidy}
            </Text>
          </Col>
        </Row>

        {/* 第二行：按钮 */}
        <Row gutter={[8, 8]}>
          <Col>
            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSaveConfig}>
              存储配置
            </Button>
          </Col>
          <Col>
            <Button size="small" icon={<UploadOutlined />} onClick={handleLoadConfig}>
              加载配置
            </Button>
          </Col>
        </Row>
      </div>

      <Row gutter={[12, 12]} style={{ height: "calc(100% - 100px)" }}>
        {/* 左侧：成员容器展示区域 */}
        <Col span={18}>
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              padding: "8px",
              height: "100%",
              backgroundColor: "#fafafa",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
                paddingBottom: "4px",
                borderBottom: "1px solid #e8e8e8",
              }}
            >
              <Text strong>成员容器</Text>
              <Space size="small">
                <Button size="small" icon={<PlusOutlined />} onClick={handleAddContainer}>
                  新增
                </Button>
                <Button size="small" icon={<ReloadOutlined />} onClick={handleRestoreDefault}>
                  恢复默认容器
                </Button>
              </Space>
            </div>

            <div
              style={{
                height: "calc(100% - 40px)",
                overflow: "auto",
                padding: "4px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "6px",
                }}
              >
                {containers.map((container) => (
                  <MemberContainer
                    key={container.id}
                    container={container}
                    onUpdate={handleUpdateContainer}
                    onDelete={handleDeleteContainer}
                    onRemoveTag={handleRemoveTagFromContainer}
                    onDropTag={handleDropTagToContainer}
                    isHighlighted={dragOverContainer === container.id}
                  />
                ))}
              </div>
            </div>

            {/* 底部总计 */}
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                right: "12px",
                backgroundColor: "rgba(255,255,255,0.9)",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #d9d9d9",
              }}
            >
              <Text strong style={{ color: "#52c41a" }}>
                总补贴：{calculateTotalSubsidy()}
                {totalAmount && ` / ${maxSubsidy}`}
              </Text>
            </div>
          </div>
        </Col>

        {/* 右侧：标签编辑区域 */}
        <Col span={6}>
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              padding: "8px",
              height: "100%",
              backgroundColor: "#fafafa",
            }}
          >
            <Text strong style={{ display: "block", marginBottom: "8px" }}>
              标签编辑
            </Text>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddTag}
              size="small"
              block
              style={{ marginBottom: "8px" }}
            >
              新增标签
            </Button>

            <div
              style={{
                height: "calc(100% - 60px)",
                overflow: "auto",
              }}
            >
              {availableTags.map((tag) => (
                <TagWithAddButton
                  key={tag.id}
                  tag={tag}
                  onUpdate={handleUpdateTag}
                  onDelete={handleDeleteTag}
                  onAddToAllContainers={handleAddTagToAllContainers}
                />
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SubsidyCalculatorV2;
