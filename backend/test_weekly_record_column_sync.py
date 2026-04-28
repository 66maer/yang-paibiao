from types import SimpleNamespace

import pytest

from app.api.v2.endpoints.my_records import ColumnConfig, get_default_columns, sync_columns_with_primary_defaults


class FakeScalarResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeFetchResult:
    def __init__(self, row):
        self.row = row

    def fetchone(self):
        return self.row


class FakeAsyncSession:
    def __init__(self, results):
        self.results = list(results)

    async def execute(self, _statement):
        if not self.results:
            raise AssertionError("缺少预期的数据库查询结果")
        return self.results.pop(0)


def test_new_week_drops_obsolete_primary_columns():
    existing_columns = [
        ColumnConfig(name="旧赛季主本", type="primary", order=0),
        ColumnConfig(name="新赛季主本一", type="primary", order=1),
        ColumnConfig(name="补贴本", type="custom", order=2),
    ]
    default_primary_columns = [
        ColumnConfig(name="新赛季主本一", type="primary", order=0),
        ColumnConfig(name="新赛季主本二", type="primary", order=1),
    ]

    synced_columns = sync_columns_with_primary_defaults(
        existing_columns,
        default_primary_columns,
        drop_obsolete_primary=True,
    )

    assert synced_columns == [
        ColumnConfig(name="新赛季主本一", type="primary", order=0),
        ColumnConfig(name="新赛季主本二", type="primary", order=1),
        ColumnConfig(name="补贴本", type="custom", order=2),
    ]


def test_current_week_turns_obsolete_primary_into_custom():
    existing_columns = [
        ColumnConfig(name="旧赛季主本", type="primary", order=0),
        ColumnConfig(name="新赛季主本一", type="primary", order=1),
        ColumnConfig(name="补贴本", type="custom", order=2),
    ]
    default_primary_columns = [
        ColumnConfig(name="新赛季主本一", type="primary", order=0),
        ColumnConfig(name="新赛季主本二", type="primary", order=1),
    ]

    synced_columns = sync_columns_with_primary_defaults(
        existing_columns,
        default_primary_columns,
        drop_obsolete_primary=False,
    )

    assert synced_columns == [
        ColumnConfig(name="新赛季主本一", type="primary", order=0),
        ColumnConfig(name="新赛季主本二", type="primary", order=1),
        ColumnConfig(name="旧赛季主本", type="custom", order=2),
        ColumnConfig(name="补贴本", type="custom", order=3),
    ]


@pytest.mark.asyncio
async def test_get_default_columns_prefers_guild_config():
    guild_options = [
        {"name": "群组次要", "type": "secondary", "order": 0},
        {"name": "群组主本二", "type": "primary", "order": 2},
        {"name": "群组主本一", "type": "primary", "order": 1},
    ]
    db = FakeAsyncSession([
        FakeScalarResult(SimpleNamespace(dungeon_options=guild_options)),
    ])

    columns = await get_default_columns(db, guild_id=123)

    assert [column.name for column in columns] == ["群组主本一", "群组主本二"]
    assert all(column.type == "primary" for column in columns)


@pytest.mark.asyncio
async def test_get_default_columns_falls_back_to_system_config():
    system_options = [
        {"name": "全局次要", "type": "secondary", "order": 0},
        {"name": "全局主本", "type": "primary", "order": 1},
    ]
    db = FakeAsyncSession([
        FakeScalarResult(None),
        FakeFetchResult((system_options,)),
    ])

    columns = await get_default_columns(db, guild_id=123)

    assert [column.name for column in columns] == ["全局主本"]
    assert columns[0].type == "primary"