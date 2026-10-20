/**
 * Phòng KH xem các nhiệm vụ đã có đơn được đơn vị xác nhận.
 */
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Badge, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import {
  danhSachNhiemVuXetDuyet,
  type NhiemVuXetDuyet,
} from '@/services/api/proposalRegistrations';

const { Text } = Typography;

const NHAN_TRANG_THAI: Record<string, { text: string; color: string }> = {
  CHO_XET: { text: 'Chờ xét', color: 'gold' },
  DA_CHAP_THUAN: { text: 'Đã chọn đơn', color: 'blue' },
  DA_GIAO: { text: 'Đã phân công', color: 'green' },
  DM_DONG_DANG_KY: { text: 'Đóng đăng ký', color: 'default' },
};

const XetDuyetDangKyPage: React.FC = () => {
  const [danhSach, setDanhSach] = useState<NhiemVuXetDuyet[]>([]);
  const [dangTai, setDangTai] = useState(true);

  const tai = useCallback(async () => {
    setDangTai(true);
    try {
      const res = await danhSachNhiemVuXetDuyet();
      setDanhSach(res.data || []);
    } catch {
      setDanhSach([]);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    void tai();
  }, [tai]);

  const cot: ColumnsType<NhiemVuXetDuyet> = [
    { title: 'Mã nhiệm vụ', dataIndex: 'code', width: 140 },
    {
      title: 'Nhiệm vụ',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'Số đơn',
      dataIndex: 'soDon',
      width: 90,
      align: 'center',
      render: (n: number) => <Badge count={n} color="#1677ff" showZero />,
    },
    {
      title: 'Thành viên trong đơn',
      render: (_, row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {row.nguoiDangKy.map((n) => (
            <Tag key={n.id} style={{ marginInlineEnd: 0 }}>
              {n.ten}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      width: 150,
      render: (_, row) => {
        const meta = NHAN_TRANG_THAI[row.trangThai || 'CHO_XET'] || NHAN_TRANG_THAI.CHO_XET;
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
  ];

  return (
    <PageContainer
      title="Xét duyệt đăng ký"
      subTitle="Hồ sơ đơn vị đã xác nhận, đang chờ Phòng Khoa học và Hợp tác quốc tế"
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Mỗi dòng là một nhiệm vụ. Bấm vào dòng để so sánh các đơn và chọn người thực hiện.
      </Text>
      <Table<NhiemVuXetDuyet>
        rowKey="id"
        loading={dangTai}
        columns={cot}
        dataSource={danhSach}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: 'Chưa có nhiệm vụ nào chờ xét duyệt.' }}
        onRow={(row) => ({
          onClick: () => history.push(`/projects/xet-duyet-dang-ky/${row.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </PageContainer>
  );
};

export default XetDuyetDangKyPage;
