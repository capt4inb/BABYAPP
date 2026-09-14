import { createMilkBag } from './milkUtils.js';

export const MAX_BATCH_BAGS = 100;
export const MILK_BATCH_STORAGE = [
  { value: 'fridge', label: 'Ngăn mát' },
  { value: 'freezer', label: 'Ngăn đông' },
  { value: 'room_temp', label: 'Để ngoài' },
];

export function createMilkBagBatch(rows, defaults) {
  if (!rows.length) throw new Error('Thêm ít nhất một dòng sữa.');
  let count = 0;
  const entries = rows.map((row, index) => {
    const volume = Number(row.volume);
    const quantity = Number(row.quantity);
    const expressedAt = row.custom ? row.expressedAt : defaults.expressedAt;
    const storageStatus = row.custom ? row.storageStatus : defaults.storageStatus;
    if (!Number.isFinite(volume) || volume < 1 || volume > 1000) {
      throw new Error(`Dòng ${index + 1}: nhập từ 1 đến 1.000 ml mỗi bịch.`);
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_BATCH_BAGS) {
      throw new Error(`Dòng ${index + 1}: số bịch phải là số nguyên từ 1 đến ${MAX_BATCH_BAGS}.`);
    }
    if (!expressedAt || !Number.isFinite(new Date(expressedAt).getTime())) {
      throw new Error(`Dòng ${index + 1}: giờ hút không hợp lệ.`);
    }
    if (!MILK_BATCH_STORAGE.some(option => option.value === storageStatus)) {
      throw new Error(`Dòng ${index + 1}: chọn nơi cất sữa.`);
    }
    count += quantity;
    return { volume, quantity, expressedAt, storageStatus };
  });
  if (count > MAX_BATCH_BAGS) throw new Error(`Mỗi lần lưu tối đa ${MAX_BATCH_BAGS} bịch.`);

  // Validate the entire batch before creating any inventory records.
  return entries.flatMap(entry => Array.from({ length: entry.quantity }, () => createMilkBag({
    volume_ml: entry.volume,
    expressed_at: entry.expressedAt,
    storage_status: entry.storageStatus,
    note: '',
  })));
}
