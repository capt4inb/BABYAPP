// Dữ liệu cân nặng trung bình của WHO (Median) theo kg từ 0 đến 24 tháng tuổi.
export const whoWeightData = {
  boy: [
    3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 
    9.6, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2
  ],
  girl: [
    3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 
    8.9, 9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.4, 10.6, 10.9, 11.1, 11.3, 11.5
  ]
};

/**
 * Lấy chuẩn cân nặng WHO dựa trên giới tính và số tháng tuổi.
 * @param {string} gender 'boy' hoặc 'girl'
 * @param {number} monthAge Số tháng tuổi (0 - 24)
 * @returns {number|null} Cân nặng trung bình (kg)
 */
export function getWHOMedianWeight(gender, monthAge) {
  if (monthAge < 0) monthAge = 0;
  if (monthAge > 24) monthAge = 24; // Limit to 24 months for now
  
  const data = whoWeightData[gender] || whoWeightData['boy'];
  return data[Math.floor(monthAge)];
}

/**
 * Đánh giá cân nặng của bé so với chuẩn WHO.
 * (Sử dụng cách ước lượng đơn giản: dao động trong khoảng ±15% là bình thường)
 * @param {number} weight Cân nặng thực tế (kg)
 * @param {number} median Cân nặng trung bình chuẩn WHO (kg)
 * @returns {object} { status: 'under', 'normal', 'over', label: string, diff: number }
 */
export function evaluateWeight(weight, median) {
  if (!median) return null;
  
  const diff = weight - median;
  const ratio = weight / median;
  
  let status = 'normal';
  let label = 'Bình thường';
  
  if (ratio < 0.85) {
    status = 'under';
    label = 'Nhẹ cân';
  } else if (ratio > 1.15) {
    status = 'over';
    label = 'Nặng cân';
  }
  
  return { status, label, diff, ratio };
}

/**
 * Tính số tháng tuổi của bé tại thời điểm ghi nhận (so với ngày sinh).
 * @param {string} birthDate Mốc thời gian sinh YYYY-MM-DD
 * @param {string} recordDate Mốc thời gian ghi cân nặng ISO
 * @returns {number|null} Số tháng tuổi
 */
export function getMonthsBetween(birthDate, recordDate) {
  if (!birthDate || !recordDate) return null;
  
  const b = new Date(birthDate);
  const r = new Date(recordDate);
  
  let months = (r.getFullYear() - b.getFullYear()) * 12;
  months -= b.getMonth();
  months += r.getMonth();
  
  // Adjust for day of month
  if (r.getDate() < b.getDate()) {
    months--;
  }
  
  return months >= 0 ? months : 0;
}
