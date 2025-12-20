import { useEffect, useState } from 'react';
import { Card, CardBody, Spinner } from '@heroui/react';
import { getAdminInfo } from '../api/auth';
import useAuthStore from '../stores/authStore';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const resp = await getAdminInfo();
        const info = resp?.data ?? resp; // 兼容拦截器返回的包装结构
        setAdminInfo(info);
        // 覆盖到全局用户信息，并显式标记为管理员
        setUser({ ...info, role: 'admin' });
      } catch (error) {
        console.error('获取管理员信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, [setUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        欢迎回来
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-2">管理员信息</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">用户名:</span> {adminInfo?.username}</p>
              <p><span className="text-gray-500">ID:</span> {adminInfo?.id}</p>
              <p>
                <span className="text-gray-500">状态:</span>{' '}
                <span className={adminInfo?.is_active ? 'text-green-600' : 'text-red-600'}>
                  {adminInfo?.is_active ? '活跃' : '未激活'}
                </span>
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-2">快捷功能</h3>
            <p className="text-sm text-gray-500">
              功能开发中...
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-2">系统统计</h3>
            <p className="text-sm text-gray-500">
              数据统计开发中...
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
