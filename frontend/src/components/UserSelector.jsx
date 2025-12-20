import { useMemo, useState, useEffect } from 'react'
import { Autocomplete, AutocompleteItem } from '@heroui/react'
import useSWR from 'swr'
import Fuse from 'fuse.js'
import { pinyin } from 'pinyin-pro'
import { getUserList } from '../api/users'

/**
 * 用户选择器组件
 * 支持按昵称（包括 other_nicknames）和 QQ 号模糊搜索
 * 混合搜索策略：优先前端模糊搜索，搜不到时再调用后端精确搜索
 * 
 * @param {Object} props
 * @param {string} props.value - 选中的用户 QQ 号
 * @param {Function} props.onChange - 值变化时的回调函数 (qqNumber) => void
 * @param {string} props.label - 标签文本
 * @param {string} props.placeholder - 占位符文本
 * @param {boolean} props.isRequired - 是否必填
 * @param {boolean} props.isDisabled - 是否禁用
 */
export default function UserSelector({
  value,
  onChange,
  label = '选择用户',
  placeholder = '输入昵称或QQ号搜索...',
  isRequired = false,
  isDisabled = false,
}) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [backendSearchEnabled, setBackendSearchEnabled] = useState(false)
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('')

  // 一次性获取大量用户数据，缓存在前端
  const { data: usersData, isLoading: isLoadingAll } = useSWR(
    'all-users-selector', // 固定key，确保只请求一次
    () => getUserList({ page: 1, page_size: 5000 }), // 加大到5000
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5分钟内去重
    }
  )

  // 后端搜索（当前端搜索结果为空且有搜索关键词时触发）
  // 使用防抖后的关键词，避免频繁请求
  const { data: backendSearchData, isLoading: isLoadingBackend } = useSWR(
    backendSearchEnabled && debouncedSearchKeyword ? ['users-backend-search', debouncedSearchKeyword] : null,
    () => getUserList({ page: 1, page_size: 100, keyword: debouncedSearchKeyword }),
    { 
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  const allUsers = usersData?.data?.items || []
  const backendUsers = backendSearchData?.data?.items || []
  
  // 判断是否已获取全部用户（如果小于5000，说明数据库就这么多，无需后端搜索）
  const hasAllUsers = allUsers.length < 5000

  // 预处理用户数据，生成拼音与首字母索引，提供更强的前端模糊匹配能力
  const enhancedUsers = useMemo(() => {
    if (!allUsers.length) return []
    const toPinyin = (text) => pinyin(text || '', { toneType: 'none', type: 'array' }).join('')
    const toInitials = (text) => pinyin(text || '', { pattern: 'first', toneType: 'none', type: 'array' }).join('')

    return allUsers.map((user) => {
      const names = [user.nickname, ...(user.other_nicknames || [])].filter(Boolean)
      const pinyins = names.map(toPinyin)
      const initials = names.map(toInitials)
      const qq = String(user.qq_number || '')

      const searchText = [
        ...names,
        ...pinyins,
        ...initials,
        qq,
      ]
        .join('|')
        .toLowerCase()

      return {
        ...user,
        searchText,
      }
    })
  }, [allUsers])

  // 防抖：延迟0.5秒后更新搜索关键词
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchKeyword])

  // 配置 Fuse.js 模糊搜索（完全在前端运行）
  const fuse = useMemo(() => {
    if (!enhancedUsers.length) return null
    return new Fuse(enhancedUsers, {
      keys: [
        { name: 'nickname', weight: 2 },
        { name: 'other_nicknames', weight: 1.5 },
        { name: 'qq_number', weight: 1 },
        { name: 'searchText', weight: 2 }, // 拼音与首字母聚合搜索
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true,
      shouldSort: true,
    })
  }, [enhancedUsers])

  // 前端模糊搜索（使用实时的 searchKeyword，保证输入即搜）
  const frontendResults = useMemo(() => {
    if (!searchKeyword || !fuse) return enhancedUsers.slice(0, 50)
    const results = fuse.search(searchKeyword)
    return results.slice(0, 50).map(result => result.item)
  }, [enhancedUsers, searchKeyword, fuse])

  // 当前端搜索结果为空且有搜索关键词时，启用后端搜索（防抖后的关键词）
  // 只有在用户数量达到5000（可能还有更多）时才启用后端搜索
  useEffect(() => {
    if (
      debouncedSearchKeyword && 
      frontendResults.length === 0 && 
      !isLoadingAll &&
      !hasAllUsers  // 关键：只有当可能还有更多用户时才请求后端
    ) {
      setBackendSearchEnabled(true)
    } else {
      setBackendSearchEnabled(false)
    }
  }, [debouncedSearchKeyword, frontendResults.length, isLoadingAll, hasAllUsers])

  // 最终展示的用户列表：优先使用前端搜索结果，为空时使用后端结果
  const displayUsers = useMemo(() => {
    if (frontendResults.length > 0) {
      return frontendResults
    }
    // 前端搜不到且后端有搜索结果时，使用后端结果
    if (backendSearchEnabled && backendUsers.length > 0) {
      return backendUsers
    }
    // 没有搜索关键词时，显示部分用户
    if (!searchKeyword) {
      return allUsers.slice(0, 50)
    }
    return []
  }, [frontendResults, backendSearchEnabled, backendUsers, searchKeyword, allUsers])

  // 处理用户显示文本
  const getPrimaryNickname = (user) => {
    if (user.nickname) return user.nickname
    const other = (user.other_nicknames || []).find(Boolean)
    return other || String(user.qq_number || '')
  }

  const getOtherNicknamesText = (user) => {
    const others = (user.other_nicknames || []).filter(Boolean)
    if (!others.length) return ''
    // 不包含主昵称，避免重复
    const primary = user.nickname || ''
    const filtered = others.filter(n => n !== primary)
    return filtered.join(', ')
  }

  const isLoading = isLoadingAll || isLoadingBackend

  return (
    <Autocomplete
      label={label}
      placeholder={placeholder}
      selectedKey={value}
      onSelectionChange={(key) => {
        onChange(key)
      }}
      inputValue={searchKeyword}
      onInputChange={setSearchKeyword}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isLoading={isLoading}
      className="w-full"
      allowsCustomValue={false}
      description={
        backendSearchEnabled && displayUsers.length > 0
          ? '从服务器搜索到的结果'
          : undefined
      }
    >
      {displayUsers.map((user) => (
        <AutocompleteItem
          key={user.qq_number}
          value={user.qq_number}
          textValue={`${getPrimaryNickname(user)} (${user.qq_number})`}
        >
          <div className="flex flex-col min-w-0">
            <div className="text-sm font-medium">
              {getPrimaryNickname(user)} ({user.qq_number})
            </div>
            {getOtherNicknamesText(user) && (
              <div className="text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
                {getOtherNicknamesText(user)}
              </div>
            )}
          </div>
        </AutocompleteItem>
      ))}
    </Autocomplete>
  )
}
