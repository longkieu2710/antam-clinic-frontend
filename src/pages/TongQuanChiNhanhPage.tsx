import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { getTongQuan, ngungDieuTri } from '../api/endpoints'
import { errorText } from '../api/http'
import type { Luot } from '../api/types'
import {
  BaseButton,
  BaseCard,
  BaseCol,
  BaseDeleteButton,
  BaseEmpty,
  BaseErrorAlert,
  BaseProgress,
  BaseRow,
  BaseStatistic,
  BaseTable,
  BaseTag,
  FileAddIcon,
  RetweetIcon,
  SearchIcon,
  useNotify,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { dateTimeVN, dateVN, money } from '../utils/format'
import { LuotDetailDrawer } from './luot/LuotDetailDrawer'
import { LUOT_QUERY_KEYS } from './luot/luotUtils'

/** Tổng quan chi nhánh: lượt hôm nay, đợt đang điều trị, doanh thu tháng, lượt gần đây, lịch hẹn, đợt quá hạn (BR12). */
export function TongQuanChiNhanhPage() {
  const { site, branch } = useSite()
  const navigate = useNavigate()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const query = useQuery({ queryKey: ['tong-quan', site], queryFn: () => getTongQuan(site) })
  const d = query.data
  const stop = useMutation({
    mutationFn: (ma: string) => ngungDieuTri(site, ma),
    onSuccess: (x) => {
      notify.warning(`Đợt "${x.tenBenh}" của ${x.tenBN} đã chuyển "Ngừng điều trị".`)
      LUOT_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
    },
    onError: (e) => notify.error(errorText(e)),
  })
  const maxTop = Math.max(1, ...(d?.topBenh ?? []).map((b) => b.soLanMac))

  const luotColumns: BaseColumns<Luot> = [
    {
      title: 'Lượt',
      width: 160,
      render: (_, r) => (
        <>
          <BaseTag color={r.loaiLuot === 'KHAM' ? 'blue' : 'purple'}>{r.loaiLuot === 'KHAM' ? 'Khám' : `Chữa lần ${r.lanThu ?? '?'}`}</BaseTag>
          <div className="muted">{dateTimeVN(r.thoiGian)}</div>
        </>
      ),
    },
    { title: 'Bệnh nhân', render: (_, r) => <><b>{r.tenBN}</b><div className="muted">{r.benh ?? 'Không phát hiện bệnh'}</div></> },
    { title: 'Bác sĩ', dataIndex: 'tenBS', render: (v: string | null, r) => v ?? r.maBS },
    { title: 'Tổng tiền', dataIndex: 'tongTien', align: 'right', width: 120, render: money },
  ]

  return (
    <>
      <PageTitle
        title="Tổng quan chi nhánh"
        description={`${branch?.tenCn ?? site}${branch?.diaChi ? ` · ${branch.diaChi}` : ''} — số liệu đọc ở trạm ${site}.`}
        extra={
          <>
            <BaseButton icon={<SearchIcon />} onClick={() => navigate('/tiep-don')}>
              Tiếp đón
            </BaseButton>
            <BaseButton type="primary" icon={<FileAddIcon />} onClick={() => navigate('/luot-kham-moi')}>
              Lượt khám
            </BaseButton>
          </>
        }
      />

      {query.error && <BaseErrorAlert title="Không tải được tổng quan" error={query.error} />}

      <BaseRow gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <BaseCol xs={12} lg={6}>
          <BaseCard style={{ height: '100%' }}>
            <BaseStatistic title="Lượt hôm nay" value={(d?.khamHomNay ?? 0) + (d?.chuaHomNay ?? 0)} loading={query.isLoading} />
            <div className="muted">
              {d?.khamHomNay ?? 0} khám · {d?.chuaHomNay ?? 0} chữa
            </div>
          </BaseCard>
        </BaseCol>
        <BaseCol xs={12} lg={6}>
          <BaseCard style={{ height: '100%' }}>
            <BaseStatistic title="Đợt đang điều trị" value={d?.dotDangDieuTri ?? 0} loading={query.isLoading} />
            <div className="muted">{d?.quaHan.length ?? 0} đợt quá 30 ngày chưa quay lại</div>
          </BaseCard>
        </BaseCol>
        <BaseCol xs={12} lg={6}>
          <BaseCard style={{ height: '100%' }}>
            <BaseStatistic title={`Doanh thu tháng ${d ? dateVN(d.ngay).slice(3) : ''}`} value={money(d?.doanhThuThang)} loading={query.isLoading} />
            <div className="muted">{d?.soLuotThang ?? 0} lượt tính đến hôm nay</div>
          </BaseCard>
        </BaseCol>
        <BaseCol xs={12} lg={6}>
          <BaseCard style={{ height: '100%' }}>
            <BaseStatistic title="Bệnh nhân mới trong tháng" value={d?.benhNhanMoiThang ?? 0} loading={query.isLoading} />
            <div className="muted">lần khám đầu tiên tại chi nhánh</div>
          </BaseCard>
        </BaseCol>
      </BaseRow>

      <BaseRow gutter={[16, 16]}>
        <BaseCol xs={24} xl={14}>
          <BaseCard title="Lượt gần đây" extra={<Link to="/luot">Xem tất cả →</Link>} styles={{ body: { padding: 0 } }}>
            <BaseTable<Luot>
              rowKey="maLuot"
              size="small"
              pagination={false}
              columns={luotColumns}
              dataSource={d?.luotGanDay ?? []}
              loading={query.isLoading}
              scroll={{ x: 600 }}
              onRow={(r) => ({ onClick: () => setParams({ ma: r.maLuot }), className: 'clickable-row' })}
            />
          </BaseCard>
        </BaseCol>
        <BaseCol xs={24} xl={10}>
          <BaseCard title="Lịch hẹn tái khám sắp tới" style={{ marginBottom: 16 }}>
            {d && d.lichHen.length === 0 ? (
              <BaseEmpty description="Không có lịch hẹn" />
            ) : (
              <ul className="list-plain">
                {(d?.lichHen ?? []).map((x) => (
                  <li key={x.maCDDT}>
                    <div>
                      <b>{x.tenBN}</b>
                      <div className="muted">
                        {x.tenBenh} · BS {x.tenBS} · đã chữa {x.soLanDaChua}/{x.soLanChuaCanThiet ?? '?'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div>{dateVN(x.ngayHenTaiKham)}</div>
                      <Link to={`/luot-chua-moi?maBN=${encodeURIComponent(x.maBN)}&maCDDT=${encodeURIComponent(x.maCDDT)}`}>
                        <RetweetIcon /> Tạo lượt chữa
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </BaseCard>

          {d && d.quaHan.length > 0 && (
            <BaseCard title="Đợt quá 30 ngày chưa quay lại (BR12)" style={{ marginBottom: 16 }}>
              <ul className="list-plain">
                {d.quaHan.map((x) => (
                  <li key={x.maCDDT}>
                    <div>
                      <b>{x.tenBN}</b>
                      <div className="muted">
                        {x.tenBenh} · lượt gần nhất {dateVN(x.luotGanNhat)}
                      </div>
                    </div>
                    <BaseDeleteButton
                      title={`Ngừng điều trị đợt "${x.tenBenh}"?`}
                      description="Đợt kết thúc, bác sĩ không được thưởng."
                      okText="Ngừng điều trị"
                      onConfirm={() => stop.mutateAsync(x.maCDDT)}
                    >
                      Ngừng điều trị
                    </BaseDeleteButton>
                  </li>
                ))}
              </ul>
            </BaseCard>
          )}

          <BaseCard title="Bệnh mắc nhiều nhất tháng này" extra={<Link to="/bc-benh">Chi tiết →</Link>}>
            {d && d.topBenh.length === 0 ? (
              <BaseEmpty description="Chưa có chẩn đoán trong tháng" />
            ) : (
              (d?.topBenh ?? []).map((b) => (
                <div key={b.maBenh} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{b.tenBenh}</span>
                    <span className="muted">
                      {b.soLanMac} lần · {b.soBenhNhan} BN
                    </span>
                  </div>
                  <BaseProgress percent={Math.round((b.soLanMac / maxTop) * 100)} showInfo={false} strokeColor="#1677ff" style={{ margin: 0 }} />
                </div>
              ))
            )}
          </BaseCard>
        </BaseCol>
      </BaseRow>

      <LuotDetailDrawer site={site} maLuot={params.get('ma')} onClose={() => setParams({})} />
    </>
  )
}
