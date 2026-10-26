import { useState } from 'react'
import {
  AddIcon,
  BaseButton,
  BaseFormItem,
  BaseFormList,
  BaseInput,
  BaseNumberInput,
  BaseSelect,
  BaseTabs,
  BaseText,
  DeleteIcon,
  useBaseWatch,
} from '../../components/common'
import type { BaseFormInstance } from '../../components/common'
import { money } from '../../utils/format'
import { giaDichVu, giaThietBi, giaThuoc, khongTrung, tinhTien } from './luotUtils'
import type { Catalogs, ChiTietFormValues } from './luotUtils'

interface Props<T extends ChiTietFormValues> {
  form: BaseFormInstance<T>
  catalogs: Catalogs
}

type TabKey = 'dichVu' | 'thuoc' | 'thietBi'

/**
 * Ba thẻ Dịch vụ & nhân công · Kê đơn thuốc · Thiết bị — mỗi thẻ là một danh sách dòng (BaseFormList) ghi vào
 * SU_DUNG_DV / KE_DON / SU_DUNG_TB. Đơn giá chỉ để xem; backend lấy đơn giá danh mục tại lúc lưu (BR7).
 */
export function LuotItemsEditor<T extends ChiTietFormValues>({ form, catalogs }: Props<T>) {
  const [tab, setTab] = useState<TabKey>('dichVu')
  const dichVu = useBaseWatch('dichVu', form) as ChiTietFormValues['dichVu']
  const thuoc = useBaseWatch('thuoc', form) as ChiTietFormValues['thuoc']
  const thietBi = useBaseWatch('thietBi', form) as ChiTietFormValues['thietBi']
  const tien = tinhTien({ dichVu, thuoc, thietBi }, catalogs)

  const label = (text: string, rows: unknown[] | undefined, amount: number) => (
    <span>
      {text}
      {rows && rows.length > 0 && <span className="muted"> · {rows.length} · {money(amount)}</span>}
    </span>
  )

  const dvOptions = catalogs.dichVu.map((d) => ({
    value: d.maDV,
    label: `${d.maDV} · ${d.tenDV}${d.loaiDV ? ` (${d.loaiDV})` : ''}`,
  }))
  const thuocOptions = catalogs.thuoc.map((t) => ({ value: t.maThuoc, label: `${t.maThuoc} · ${t.tenThuoc} · ${t.donViTinh}` }))
  const tbOptions = catalogs.thietBi.map((t) => ({
    value: t.maTB,
    label: `${t.maTB} · ${t.tenTB}${t.tinhTrang && t.tinhTrang !== 'Hoạt động tốt' ? ` — ${t.tinhTrang}` : ''}`,
  }))

  return (
    <BaseTabs
      activeKey={tab}
      onChange={(k) => setTab(k as TabKey)}
      items={[
        {
          key: 'dichVu',
          label: label('Dịch vụ & nhân công', dichVu, tien.dichVu),
          forceRender: true,
          children: (
            <BaseFormList name="dichVu">
              {(fields, { add, remove }) => (
                <>
                  {fields.length > 0 && <Head cols={['Dịch vụ', 'SL', 'Đơn giá', 'Thành tiền', 'Kết quả']} />}
                  {fields.map((field) => {
                    const row = dichVu?.[field.name]
                    const gia = giaDichVu(catalogs, row?.maDV)
                    return (
                      <div className="item-row" key={field.key}>
                        <BaseFormItem
                          name={[field.name, 'maDV']}
                          rules={[{ required: true, message: 'Chọn dịch vụ' }, khongTrung('dichVu', 'maDV', 'Dịch vụ')]}
                        >
                          <BaseSelect showSearch={{ optionFilterProp: 'label' }} placeholder="Chọn dịch vụ" options={dvOptions} aria-label="Dịch vụ" />
                        </BaseFormItem>
                        <BaseFormItem name={[field.name, 'soLuong']} rules={[{ required: true, message: 'Nhập SL' }]}>
                          <BaseNumberInput min={1} precision={0} aria-label="Số lượng" />
                        </BaseFormItem>
                        <div className="item-money muted">{row?.maDV ? money(gia) : '—'}</div>
                        <div className="item-money">{row?.maDV ? money(gia * (row?.soLuong ?? 0)) : '—'}</div>
                        <BaseFormItem name={[field.name, 'ketQua']}>
                          <BaseInput placeholder="Kết quả (nếu có)" maxLength={500} />
                        </BaseFormItem>
                        <BaseButton type="text" danger icon={<DeleteIcon />} aria-label="Xoá dòng" onClick={() => remove(field.name)} />
                      </div>
                    )
                  })}
                  <AddRow onAdd={() => add({ soLuong: 1 })} table="SU_DUNG_DV" />
                </>
              )}
            </BaseFormList>
          ),
        },
        {
          key: 'thuoc',
          label: label('Kê đơn thuốc', thuoc, tien.thuoc),
          forceRender: true,
          children: (
            <BaseFormList name="thuoc">
              {(fields, { add, remove }) => (
                <>
                  {fields.length > 0 && <Head cols={['Thuốc', 'SL', 'Đơn giá', 'Thành tiền', 'Liều dùng']} />}
                  {fields.map((field) => {
                    const row = thuoc?.[field.name]
                    const gia = giaThuoc(catalogs, row?.maThuoc)
                    return (
                      <div className="item-row" key={field.key}>
                        <BaseFormItem
                          name={[field.name, 'maThuoc']}
                          rules={[{ required: true, message: 'Chọn thuốc' }, khongTrung('thuoc', 'maThuoc', 'Thuốc')]}
                        >
                          <BaseSelect showSearch={{ optionFilterProp: 'label' }} placeholder="Chọn thuốc" options={thuocOptions} aria-label="Thuốc" />
                        </BaseFormItem>
                        <BaseFormItem name={[field.name, 'soLuong']} rules={[{ required: true, message: 'Nhập SL' }]}>
                          <BaseNumberInput min={1} precision={0} aria-label="Số lượng" />
                        </BaseFormItem>
                        <div className="item-money muted">{row?.maThuoc ? money(gia) : '—'}</div>
                        <div className="item-money">{row?.maThuoc ? money(gia * (row?.soLuong ?? 0)) : '—'}</div>
                        <BaseFormItem name={[field.name, 'lieuDung']}>
                          <BaseInput placeholder="VD: Ngày 2 viên sau ăn" maxLength={255} />
                        </BaseFormItem>
                        <BaseButton type="text" danger icon={<DeleteIcon />} aria-label="Xoá dòng" onClick={() => remove(field.name)} />
                      </div>
                    )
                  })}
                  <AddRow onAdd={() => add({ soLuong: 1 })} table="KE_DON" />
                </>
              )}
            </BaseFormList>
          ),
        },
        {
          key: 'thietBi',
          label: label('Thiết bị', thietBi, tien.thietBi),
          forceRender: true,
          children: (
            <BaseFormList name="thietBi">
              {(fields, { add, remove }) => (
                <>
                  {fields.length > 0 && <Head cols={['Thiết bị', 'Số lần', 'Đơn giá', 'Thành tiền']} noExtra />}
                  {fields.map((field) => {
                    const row = thietBi?.[field.name]
                    const gia = giaThietBi(catalogs, row?.maTB)
                    return (
                      <div className="item-row no-extra" key={field.key}>
                        <BaseFormItem
                          name={[field.name, 'maTB']}
                          rules={[{ required: true, message: 'Chọn thiết bị' }, khongTrung('thietBi', 'maTB', 'Thiết bị')]}
                        >
                          <BaseSelect showSearch={{ optionFilterProp: 'label' }} placeholder="Chọn thiết bị" options={tbOptions} aria-label="Thiết bị" />
                        </BaseFormItem>
                        <BaseFormItem name={[field.name, 'soLan']} rules={[{ required: true, message: 'Nhập số lần' }]}>
                          <BaseNumberInput min={1} precision={0} aria-label="Số lần" />
                        </BaseFormItem>
                        <div className="item-money muted">{row?.maTB ? money(gia) : '—'}</div>
                        <div className="item-money">{row?.maTB ? money(gia * (row?.soLan ?? 0)) : '—'}</div>
                        <BaseButton type="text" danger icon={<DeleteIcon />} aria-label="Xoá dòng" onClick={() => remove(field.name)} />
                      </div>
                    )
                  })}
                  <AddRow onAdd={() => add({ soLan: 1 })} table="SU_DUNG_TB" />
                </>
              )}
            </BaseFormList>
          ),
        },
      ]}
    />
  )
}

function Head({ cols, noExtra }: { cols: string[]; noExtra?: boolean }) {
  return (
    <div className={`item-row item-head${noExtra ? ' no-extra' : ''}`}>
      {cols.map((c, i) => (
        <div key={c} style={i === 2 || i === 3 ? { textAlign: 'right' } : undefined}>
          {c}
        </div>
      ))}
      <div />
    </div>
  )
}

function AddRow({ onAdd, table }: { onAdd: () => void; table: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <BaseButton icon={<AddIcon />} onClick={onAdd}>
        Thêm dòng
      </BaseButton>
      <BaseText type="secondary" style={{ fontSize: 12 }}>
        Ghi vào <code>{table}</code> · đơn giá lấy từ danh mục tại lúc lưu (BR7)
      </BaseText>
    </div>
  )
}
