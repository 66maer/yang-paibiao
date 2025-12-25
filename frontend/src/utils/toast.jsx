import { addToast, closeToast } from "@heroui/toast";

/**
 * 成功提示
 */
export const showSuccess = (message) => {
  addToast({
    title: message,
    color: "success",
    timeout: 3000,
  });
};

/**
 * 错误提示
 */
export const showError = (message) => {
  addToast({
    title: message,
    color: "danger",
    timeout: 4000,
  });
};

/**
 * 信息提示
 */
export const showInfo = (message) => {
  addToast({
    title: message,
    color: "default",
    timeout: 3000,
  });
};

/**
 * 警告提示
 */
export const showWarning = (message) => {
  addToast({
    title: message,
    color: "warning",
    icon: "⚠️",
    timeout: 3000,
  });
};

/**
 * 确认对话框
 * @param {string} message - 确认消息
 * @returns {Promise<boolean>} - 用户选择结果
 */
export const showConfirm = (message) => {
  return new Promise((resolve) => {
    let toastId;

    const handleClose = (result) => {
      if (toastId) {
        closeToast(toastId);
      }
      resolve(result);
    };

    toastId = addToast({
      title: message,
      description: (
        <div className="flex gap-2 justify-end mt-3">
          <button
            className="px-4 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            onClick={() => handleClose(false)}
          >
            取消
          </button>
          <button
            className="px-4 py-1.5 text-sm bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
            onClick={() => handleClose(true)}
          >
            确定
          </button>
        </div>
      ),
      color: "default",
      timeout: Infinity,
      hideCloseButton: true,
    });
  });
};

/**
 * Toast 工具对象（统一接口）
 */
export const showToast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  confirm: showConfirm,
};
