import toast from 'react-hot-toast'

/**
 * 成功提示
 */
export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
  })
}

/**
 * 错误提示
 */
export const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
  })
}

/**
 * 信息提示
 */
export const showInfo = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-center',
  })
}

/**
 * 警告提示
 */
export const showWarning = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-center',
    icon: '⚠️',
  })
}

/**
 * 确认对话框
 * @param {string} message - 确认消息
 * @returns {Promise<boolean>} - 用户选择结果
 */
export const showConfirm = (message) => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            onClick={() => {
              toast.dismiss(t.id)
              resolve(false)
            }}
          >
            取消
          </button>
          <button
            className="px-4 py-1.5 text-sm bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
            onClick={() => {
              toast.dismiss(t.id)
              resolve(true)
            }}
          >
            确定
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    })
  })
}

/**
 * Toast 工具对象（统一接口）
 */
export const showToast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  confirm: showConfirm,
}

export default toast
