from app.api.v2.endpoints.my_records import ColumnConfig, sync_columns_with_primary_defaults


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