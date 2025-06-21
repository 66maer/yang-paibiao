import React from "react";
import { Modal } from "antd";
import PriceChart from "./PriceChart";

const PriceTrendModal = ({ visible, onClose, teams }) => {
  return (
    <Modal title="价格走势分析" open={visible} onCancel={onClose} footer={null} width={900}>
      <PriceChart teams={teams} />
    </Modal>
  );
};

export default PriceTrendModal;
