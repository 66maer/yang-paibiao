import { Slider } from "@heroui/react";

/**
 * 分工资滑块组件
 * 显示打工人数和老板人数的分配情况
 *
 * @param {number} value - 当前值(老板人数，10-25)
 * @param {function} onChange - 值变化回调
 */
export default function WorkerSlider({ value, onChange }) {
  const totalPeople = 25;
  const workerCount = value;
  const bossCount = totalPeople - value;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
        <span>
          打工: <span className="font-semibold text-blue-600 dark:text-blue-400">{workerCount}</span>人
        </span>
        <span>
          老板: <span className="font-semibold text-purple-600 dark:text-purple-400">{bossCount}</span>人
        </span>
      </div>
      <Slider
        value={value}
        onChange={onChange}
        minValue={10}
        maxValue={25}
        step={1}
        className="max-w-full"
        color="secondary"
        size="sm"
        marks={[
          { value: 10, label: "10" },
          { value: 15, label: "15" },
          { value: 20, label: "20" },
          { value: 25, label: "25" },
        ]}
      />
    </div>
  );
}
