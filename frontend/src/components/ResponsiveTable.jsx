import { useState } from 'react';
import {
  Grid, Table, Modal, Descriptions, Card, Button, Empty, Spin, Pagination,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';

const { useBreakpoint } = Grid;

function getRecordKey(record, rowKey) {
  if (typeof rowKey === 'function') return rowKey(record);
  return record[rowKey];
}

export default function ResponsiveTable({
  columns,
  dataSource = [],
  rowKey = 'id',
  loading = false,
  pagination = false,
  mobileTitle,
  mobileSubtitle,
  excludeFromDetail = ['aksi', 'index'],
  mobileActions = [],
  scroll = { x: 'max-content' },
  ...rest
}) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [detail, setDetail] = useState(null);
  const [page, setPage] = useState(1);

  if (!isMobile) {
    return (
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        scroll={scroll}
        {...rest}
      />
    );
  }

  const detailColumns = columns.filter((c) => !excludeFromDetail.includes(String(c.key)));

  const paginationObj = pagination === true ? {} : (pagination && typeof pagination === 'object' ? pagination : null);
  const clientSide = paginationObj && !paginationObj.total;
  const pageSize = (paginationObj && paginationObj.pageSize) || 10;

  const totalPages = Math.max(1, Math.ceil(dataSource.length / pageSize));
  const currentPage = clientSide ? Math.min(page, totalPages) : (paginationObj ? paginationObj.current || 1 : 1);
  const visibleData = clientSide
    ? dataSource.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : dataSource;

  const handlePaginationChange = (p) => {
    if (clientSide) setPage(p);
    else if (paginationObj && paginationObj.onChange) paginationObj.onChange(p, paginationObj.pageSize);
  };

  const handleAction = (action, record) => {
    if (action.confirmText) {
      Modal.confirm({
        title: action.confirmTitle || 'Konfirmasi',
        content: action.confirmText,
        okButtonProps: action.danger ? { danger: true } : undefined,
        onOk: () => action.onClick(record),
      });
    } else {
      action.onClick(record);
    }
  };

  const showPagination = Boolean(paginationObj);

  return (
    <>
      <Spin spinning={loading}>
        {visibleData.length === 0 && !loading ? (
          <Empty description="Tidak ada data" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleData.map((record) => (
              <Card key={getRecordKey(record, rowKey)} size="small">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>
                      {mobileTitle ? mobileTitle(record) : '#'}
                    </div>
                    {mobileSubtitle && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2, wordBreak: 'break-word' }}>
                        {mobileSubtitle(record)}
                      </div>
                    )}
                  </div>
                  <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetail(record)}>
                    Detail
                  </Button>
                </div>
                {mobileActions.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {mobileActions.map((action) => (
                      <Button
                        key={action.key}
                        type="link"
                        size="small"
                        danger={action.danger}
                        icon={action.icon}
                        onClick={() => handleAction(action, record)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Spin>

      {showPagination && (
        <Pagination
          simple
          size="small"
          current={currentPage}
          pageSize={pageSize}
          total={clientSide ? dataSource.length : (paginationObj ? paginationObj.total || 0 : 0)}
          onChange={handlePaginationChange}
          style={{ marginTop: 12, textAlign: 'center' }}
        />
      )}

      <Modal
        title="Detail"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={420}
      >
        {detail && (
          <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
            {detailColumns.map((col) => (
              <Descriptions.Item key={col.key} label={col.title}>
                {col.render
                  ? col.render(detail[col.dataIndex], detail, 0)
                  : (detail[col.dataIndex] ?? '-')}
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Modal>
    </>
  );
}
