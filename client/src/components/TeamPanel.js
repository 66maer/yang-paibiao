import React from "react";
import { Flex, Space, Tag } from "antd";
import { ShowCard, EditCard } from "./TeamCard";

const ShowPanel = ({ slots, onUserCancelSignup }) => {
  const team = Array.from({ length: 5 }).map((_, i) => {
    const squad = Array.from({ length: 5 }).map((_, j) => {
      return (
        <ShowCard
          member={slots[i * 5 + j].member}
          rule={slots[i * 5 + j].rule}
          onUserCancelSignup={onUserCancelSignup}
        />
      );
    });
    return <Flex vertical>{squad}</Flex>;
  });

  return <Flex gap={5}>{team}</Flex>;
};

const EditPanel = ({ onSave, slots, onlyRule }) => {
  const team = Array.from({ length: 5 }).map((_, i) => {
    const squad = Array.from({ length: 5 }).map((_, j) => {
      return (
        <EditCard
          member={slots[i * 5 + j].member}
          rule={slots[i * 5 + j].rule}
          onSave={(m, r) => {
            slots[i * 5 + j] = { member: m, rule: r };
            onSave && onSave(slots);
          }}
          onlyRule={onlyRule}
        />
      );
    });
    return <Flex vertical>{squad}</Flex>;
  });

  return <Flex gap={5}>{team}</Flex>;
};

export { ShowPanel, EditPanel };
