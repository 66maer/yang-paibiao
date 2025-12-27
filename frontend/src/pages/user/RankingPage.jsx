import { useState, useEffect } from 'react'
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  Spinner,
} from '@heroui/react'
import { getGuildRanking } from '../../api/ranking'
import useAuthStore from '../../stores/authStore'
import { showError } from '../../utils/toast.jsx'

export default function RankingPage() {
  const [ranking, setRanking] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const currentGuild = user?.guilds?.find((g) => g.id === user?.current_guild_id)

  useEffect(() => {
    loadRanking()
  }, [currentGuild?.id])

  const loadRanking = async () => {
    if (!currentGuild?.id) return

    setLoading(true)
    try {
      const response = await getGuildRanking(currentGuild.id)
      setRanking(response.data)
    } catch (error) {
      console.error('加载红黑榜失败:', error)
      showError(error.response?.data?.detail || '加载红黑榜失败')
    } finally {
      setLoading(false)
    }
  }

  const renderChangeIndicator = (change, value) => {
    if (change === 'new') {
      return (
        <Chip size="sm" color="primary" variant="flat">
          NEW
        </Chip>
      )
    } else if (change === 'up') {
      return (
        <span className="text-green-500 font-medium flex items-center gap-1">
          <span>↑</span>
          <span>{value}</span>
        </span>
      )
    } else if (change === 'down') {
      return (
        <span className="text-red-500 font-medium flex items-center gap-1">
          <span>↓</span>
          <span>{value}</span>
        </span>
      )
    } else {
      return <span className="text-gray-400">—</span>
    }
  }

  const formatLastHeibenren = (dateStr, carNumber, daysAgo) => {
    if (!dateStr) return '-'
    const dateObj = new Date(dateStr)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()
    return (
      <div className="flex flex-col gap-1">
        <div>{`${year}年${month}月${day}日`}</div>
        <div className="text-xs text-gray-500">
          {carNumber && `第${carNumber}车`}
          {daysAgo !== null && daysAgo !== undefined && ` · ${daysAgo}天前`}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!ranking) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="text-gray-500">暂无数据</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardBody>
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-purple-600 to-black bg-clip-text text-transparent">
              红黑榜
            </h1>
            <p className="text-sm text-gray-500 mt-1">{ranking.guild_name}</p>
          </div>

          {ranking.rankings.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无黑本记录
            </div>
          ) : (
            <Table aria-label="红黑榜">
              <TableHeader>
                <TableColumn>排名</TableColumn>
                <TableColumn>用户</TableColumn>
                <TableColumn>黑本次数</TableColumn>
                <TableColumn>平均金团</TableColumn>
                <TableColumn>Rank分</TableColumn>
                <TableColumn>最近黑本</TableColumn>
                <TableColumn>变化</TableColumn>
              </TableHeader>
              <TableBody>
                {ranking.rankings.map((item) => (
                  <TableRow key={item.user_id}>
                    <TableCell>
                      <div className="font-bold text-lg">
                        {item.rank_position <= 3 ? (
                          <span
                            className={
                              item.rank_position === 1
                                ? 'text-yellow-500'
                                : item.rank_position === 2
                                ? 'text-gray-400'
                                : 'text-orange-600'
                            }
                          >
                            #{item.rank_position}
                          </span>
                        ) : (
                          <span className="text-gray-600">
                            #{item.rank_position}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.user_avatar && (
                          <Avatar src={item.user_avatar} size="sm" />
                        )}
                        <span className="font-medium">{item.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {item.heibenren_count}次
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">
                        {Number(item.average_gold).toFixed(0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-lg text-primary">
                        {Number(item.rank_score).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatLastHeibenren(
                        item.last_heibenren_date,
                        item.last_heibenren_car_number,
                        item.last_heibenren_days_ago
                      )}
                    </TableCell>
                    <TableCell>
                      {renderChangeIndicator(
                        item.rank_change,
                        item.rank_change_value
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
