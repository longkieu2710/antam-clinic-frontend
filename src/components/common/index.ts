/**
 * Component dùng chung — lớp bọc quanh Ant Design, chia theo nhóm chức năng:
 *
 *   provider/    cấu hình chung (tiếng Việt, theme)        BaseProvider
 *   layout/      khung & bố cục                            BaseLayout, BaseHeader, BaseSider, BaseContent, BaseMenu, BaseRow, BaseCol, BaseSpace, BaseDivider,
 *                                                             BaseTabs
 *   form/        form & ô nhập liệu                        BaseForm, BaseFormItem, BaseFormList, useBaseForm, useBaseWatch, BaseInput, BaseSearchInput, BaseTextArea,
 *                                                             BaseNumberInput, BaseMoneyInput, BaseSelect, BaseTagsInput, BaseDatePicker, BaseDateTimePicker,
 *                                                             BaseMonthPicker, BaseDateRangePicker, BaseCheckableTags, BaseSegmented
 *   table/       bảng & thành phần của bảng                BaseTable, BaseColumns, BaseEditButton, BaseDeleteButton, BaseSummaryRow, BaseSummaryCell
 *   button/      nút bấm                                   BaseButton
 *   typography/  chữ                                       BaseTitle, BaseText, BaseParagraph
 *   display/     hiển thị thông tin                        BaseTag, BaseBadge, BaseTooltip, BaseCard, BaseDescriptions, BaseStatistic, BaseProgress, BaseEmpty
 *   feedback/    phản hồi người dùng                       BaseAlert, BaseErrorAlert, BaseModal, BaseFormModal, BaseDrawer, BaseResult, BaseSkeleton,
 *                                                             useNotify
 *   icons/       icon                                      AddIcon, EditIcon, DeleteIcon…
 *
 * Quy ước: màn hình (pages/, layout/) CHỈ import giao diện từ đây, không import trực tiếp 'antd' / '@ant-design/icons'
 * (oxlint báo lỗi nếu vi phạm):
 *   import { BaseButton, BaseTable } from '../components/common'
 * Thêm component mới: tạo BaseXxx.tsx trong nhóm phù hợp và export trong index.ts của nhóm đó.
 */
export * from './provider'
export * from './layout'
export * from './form'
export * from './table'
export * from './button'
export * from './typography'
export * from './display'
export * from './feedback'
export * from './icons'
