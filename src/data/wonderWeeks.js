// Wonder Weeks - 10 Tuần Nhảy Vọt
// Dữ liệu dựa trên nghiên cứu của Dr. Frans Plooij & Dr. Hetty van de Rijt
// Tuần tính từ ngày DỰ SINH (không phải ngày sinh thực tế)
// stormStart/stormEnd: khoảng tuần mà bé thường quấy/khó chịu trước và trong leap

export const LEAPS = [
  {
    leap: 1,
    nameVi: 'Thế giới Cảm giác',
    nameEn: 'Changing Sensations',
    emoji: '✨',
    week: 5,
    stormStart: 4,
    stormEnd: 6,
    durationDays: 7,
    color: '#FF9A9E',
    colorLight: '#FFF0F1',
    skillsVi: [
      'Nhận biết âm thanh quen thuộc tốt hơn',
      'Phân biệt sáng tối rõ ràng hơn',
      'Phản xạ tay chân trở nên phong phú hơn',
      'Cảm nhận mùi hương và vị giác nhạy bén hơn',
      'Có thể mỉm cười lần đầu tiên',
    ],
    symptomsVi: [
      'Khóc nhiều hơn bình thường',
      'Bú liên tục, bú cluster',
      'Khó ngủ, ngủ không sâu',
      'Bám mẹ nhiều hơn',
      'Dễ giật mình',
    ],
    description:
      'Bé bắt đầu cảm nhận thế giới qua các giác quan mới phát triển. Hệ thần kinh hoạt động mạnh mẽ hơn khiến bé có thể nghe, nhìn, ngửi và cảm nhận sâu hơn. Đây là lúc bé cần nhiều vỗ về và tiếp xúc da kề da nhất.',
  },
  {
    leap: 2,
    nameVi: 'Thế giới Hình mẫu',
    nameEn: 'Patterns',
    emoji: '🔲',
    week: 8,
    stormStart: 7,
    stormEnd: 9,
    durationDays: 14,
    color: '#A8EDEA',
    colorLight: '#F0FDFC',
    skillsVi: [
      'Nhận biết khuôn mặt người thân',
      'Nhìn theo vật di chuyển',
      'Phát hiện các hình mẫu đơn giản',
      'Nghe và phân biệt các âm thanh khác nhau',
      'Bắt đầu bi bô, phát âm',
    ],
    symptomsVi: [
      'Quấy khóc dai dẳng hơn',
      'Ngủ nhiều hơn hoặc ít hơn thường ngày',
      'Bú thường xuyên hơn',
      'Cần được bế ẵm nhiều',
      'Thích nhìn chăm chú vào khuôn mặt',
    ],
    description:
      'Não bé bắt đầu nhận dạng được các hình mẫu trong thế giới xung quanh — khuôn mặt quen thuộc, hình dạng, âm thanh lặp lại. Bé có thể dõi theo đồ vật di chuyển và bắt đầu "đối thoại" bằng âm thanh.',
  },
  {
    leap: 3,
    nameVi: 'Thế giới Chuyển tiếp Mượt mà',
    nameEn: 'Smooth Transitions',
    emoji: '🌊',
    week: 12,
    stormStart: 11,
    stormEnd: 13,
    durationDays: 14,
    color: '#96E6A1',
    colorLight: '#F0FDF4',
    skillsVi: [
      'Kiểm soát chuyển động tay chân tốt hơn',
      'Theo dõi đồ vật chuyển động mượt mà',
      'Bắt đầu phát ra nhiều âm thanh khác nhau',
      'Nhận ra giọng nói của bố/mẹ',
      'Cười thành tiếng lần đầu',
    ],
    symptomsVi: [
      'Khóc nhiều, khó dỗ',
      'Bú kém, bỏ cữ',
      'Ngủ bất thường',
      'Dính mẹ không rời',
      'Đòi chú ý liên tục',
    ],
    description:
      'Bé học cách điều phối các chuyển động mượt mà — tay chân không còn co rút đột ngột mà bắt đầu có kiểm soát. Bé cũng bắt đầu hiểu rằng những thứ xung quanh không phải "bật-tắt" mà có sự thay đổi từng bước.',
  },
  {
    leap: 4,
    nameVi: 'Thế giới Sự kiện',
    nameEn: 'Events',
    emoji: '🎯',
    week: 19,
    stormStart: 17,
    stormEnd: 20,
    durationDays: 21,
    color: '#FFEAA7',
    colorLight: '#FFFBF0',
    skillsVi: [
      'Hiểu quan hệ nhân quả đơn giản',
      'Lắc đồ vật để nghe âm thanh',
      'Bắt đầu phân biệt bố mẹ với người lạ',
      'Hiểu ý nghĩa của một số âm thanh/cử chỉ',
      'Cố gắng với tay lấy đồ vật',
    ],
    symptomsVi: [
      'Sợ người lạ (xa lạ lo âu)',
      'Quấy khóc mạnh, kéo dài',
      'Ngủ rất kém, thức nhiều ban đêm',
      'Bú liên tục (cluster feeding)',
      'Cáu kỉnh, khó chịu',
    ],
    description:
      'Đây là một trong những leap khó nhất. Bé bắt đầu hiểu rằng thế giới được tạo thành từ các "sự kiện" — chuỗi hành động có liên kết với nhau. Sự xa lạ lo âu thường bắt đầu ở giai đoạn này vì bé đã nhận ra được sự khác biệt giữa người quen và người lạ.',
  },
  {
    leap: 5,
    nameVi: 'Thế giới Mối quan hệ',
    nameEn: 'Relationships',
    emoji: '🔗',
    week: 26,
    stormStart: 22,
    stormEnd: 27,
    durationDays: 35,
    color: '#DDA0DD',
    colorLight: '#FDF4FF',
    skillsVi: [
      'Hiểu khoảng cách giữa các đồ vật',
      'Bắt đầu bò hoặc cố gắng di chuyển',
      'Nhặt đồ vật nhỏ bằng ngón tay',
      'Hiểu "không" và phản ứng với nó',
      'Bắt đầu chơi trò tìm và thấy',
    ],
    symptomsVi: [
      'Khó chịu, quấy khóc cực độ',
      'Cần mẹ liên tục, khóc khi mẹ rời đi',
      'Rối loạn giấc ngủ nặng',
      'Ăn kém, bú ít',
      'Hay ốm vặt do hệ miễn dịch phát triển',
    ],
    description:
      'Bé bắt đầu hiểu mối quan hệ không gian giữa bản thân và đồ vật xung quanh. Đây là thời điểm bé bắt đầu muốn khám phá nhưng vẫn cần mẹ như "căn cứ an toàn". Leap này thường kéo dài và mệt mỏi cho cả bé lẫn cha mẹ.',
  },
  {
    leap: 6,
    nameVi: 'Thế giới Phân loại',
    nameEn: 'Categories',
    emoji: '🗂️',
    week: 37,
    stormStart: 33,
    stormEnd: 38,
    durationDays: 35,
    color: '#F9CA24',
    colorLight: '#FFFBEB',
    skillsVi: [
      'Phân biệt và sắp xếp đồ vật theo nhóm',
      'Hiểu khái niệm "nhiều" và "ít"',
      'Nhận biết các con vật, đồ vật quen thuộc',
      'Bắt đầu nói các từ đơn giản',
      'Hiểu và thực hiện yêu cầu đơn giản',
    ],
    symptomsVi: [
      'Nổi cơn thịnh nộ (tantrum)',
      'Đặc biệt khó ngủ',
      'Thử thách giới hạn của cha mẹ',
      'Đòi ăn một loại thức ăn nhất định',
      'Hay nhăn nhó, khó chịu',
    ],
    description:
      'Bé bắt đầu phân loại thế giới — hiểu rằng chó con và chó lớn đều là "chó", táo xanh và táo đỏ đều là "táo". Đây là bước tiến nhận thức lớn giúp bé học ngôn ngữ nhanh hơn và bắt đầu có ý kiến riêng về mọi thứ.',
  },
  {
    leap: 7,
    nameVi: 'Thế giới Chuỗi hành động',
    nameEn: 'Sequences',
    emoji: '🔄',
    week: 46,
    stormStart: 42,
    stormEnd: 47,
    durationDays: 35,
    color: '#6C5CE7',
    colorLight: '#F5F3FF',
    skillsVi: [
      'Thực hiện chuỗi hành động có thứ tự',
      'Chơi trò "làm như người lớn"',
      'Hiểu khái niệm "trước" và "sau"',
      'Bắt đầu có thể mặc quần áo đơn giản',
      'Nói được câu 2 từ',
    ],
    symptomsVi: [
      'Rất bướng bỉnh',
      'Hay khóc vì thất vọng',
      'Cần mọi thứ "đúng trật tự"',
      'Mất ngủ giữa đêm',
      'Kén ăn cực độ',
    ],
    description:
      'Bé hiểu rằng nhiều việc trong cuộc sống phải thực hiện theo trình tự nhất định — mặc quần trước khi mặc giày, rửa tay trước khi ăn. Bé bắt đầu bắt chước và thực hành các chuỗi hành động này, đôi khi dẫn đến bực bội khi trình tự bị phá vỡ.',
  },
  {
    leap: 8,
    nameVi: 'Thế giới Chương trình',
    nameEn: 'Programs',
    emoji: '🎮',
    week: 55,
    stormStart: 51,
    stormEnd: 56,
    durationDays: 35,
    color: '#00B894',
    colorLight: '#F0FFF9',
    skillsVi: [
      'Hiểu rằng có thể đạt mục tiêu theo nhiều cách',
      'Giải quyết vấn đề đơn giản',
      'Chơi trò chơi có luật đơn giản',
      'Diễn đạt bằng câu 3-4 từ',
      'Bắt đầu có ý thức về bản thân',
    ],
    symptomsVi: [
      'Thích kiểm soát mọi thứ',
      'Tantrum dữ dội khi không được làm theo ý',
      'Hay ghen tị',
      'Khó khăn khi chuyển từ hoạt động này sang hoạt động khác',
      'Thức dậy ban đêm đòi cha mẹ',
    ],
    description:
      'Bé hiểu rằng có thể đạt được một mục tiêu bằng nhiều "chương trình" (chuỗi hành động) khác nhau, và bé có thể tự chọn cách phù hợp nhất. Đây là bước nhận thức cao giúp bé bắt đầu giải quyết vấn đề một cách sáng tạo.',
  },
  {
    leap: 9,
    nameVi: 'Thế giới Nguyên tắc',
    nameEn: 'Principles',
    emoji: '⚖️',
    week: 64,
    stormStart: 60,
    stormEnd: 65,
    durationDays: 35,
    color: '#E17055',
    colorLight: '#FFF5F3',
    skillsVi: [
      'Hiểu và theo quy tắc xã hội cơ bản',
      'Thể hiện sự đồng cảm',
      'Biết chia sẻ (dù còn khó)',
      'Hiểu khái niệm "công bằng"',
      'Bắt đầu nói thành câu hoàn chỉnh',
    ],
    symptomsVi: [
      'Muốn mọi thứ phải "công bằng"',
      'Hay ăn vạ khi không được như ý',
      'Thử thách quy tắc liên tục',
      'Ngủ bất thường, thức khuya',
      'Trở nên nhút nhát hoặc hung hăng hơn',
    ],
    description:
      'Bé bắt đầu hiểu nguyên tắc vận hành của thế giới xã hội — quy tắc, công bằng, lòng tốt, sự hung hăng. Bé có thể thích nghi với quy tắc hoặc bẻ gãy chúng tùy tình huống. Đây là giai đoạn nền tảng của đạo đức và cảm xúc xã hội.',
  },
  {
    leap: 10,
    nameVi: 'Thế giới Hệ thống',
    nameEn: 'Systems',
    emoji: '🌐',
    week: 75,
    stormStart: 71,
    stormEnd: 76,
    durationDays: 35,
    color: '#0984E3',
    colorLight: '#F0F8FF',
    skillsVi: [
      'Hiểu hệ thống xã hội phức tạp',
      'Xây dựng bản sắc cá nhân',
      'Hiểu và kiểm soát cảm xúc bản thân',
      'Có thể đặt mình vào vị trí người khác',
      'Đặt câu hỏi "tại sao" liên tục',
    ],
    symptomsVi: [
      'Thay đổi tính khí đột ngột',
      'Muốn kiểm soát mọi quyết định',
      'Hay xung đột với bố mẹ về quyền tự chủ',
      'Có thể nói dối lần đầu tiên',
      'Khủng hoảng ngủ có thể xuất hiện lại',
    ],
    description:
      'Đây là leap cuối cùng và phức tạp nhất. Bé bắt đầu hiểu "hệ thống" — gia đình, xã hội, các quy tắc ứng xử. Bé phát triển ý thức về bản thân, ý chí riêng, và bắt đầu hiểu rằng mọi người có suy nghĩ và cảm xúc khác nhau. Đây là nền tảng của trí tuệ cảm xúc.',
  },
];

/**
 * Tính tuần tuổi của bé tính từ ngày sinh (hoặc ngày dự sinh)
 * @param {string} birthDateStr - ISO date string (YYYY-MM-DD)
 * @param {string} dueDateStr - ISO date string (YYYY-MM-DD), optional
 * @returns {number} Số tuần tuổi tính từ ngày dự sinh
 */
export function getBabyWeekAge(birthDateStr, dueDateStr) {
  const refDate = dueDateStr ? new Date(dueDateStr) : new Date(birthDateStr);
  const now = new Date();
  const diffMs = now - refDate;
  const diffWeeks = diffMs / (1000 * 60 * 60 * 24 * 7);
  return Math.floor(diffWeeks);
}

/**
 * Lấy trạng thái Wonder Weeks hiện tại của bé
 * @param {number} weekAge - Tuần tuổi của bé
 * @returns {{ status: 'stormy'|'sunny'|'no_data', currentLeap: object|null, nextLeap: object|null }}
 */
export function getWonderWeekStatus(weekAge) {
  // Tìm leap đang trong giai đoạn storm
  const currentLeap = LEAPS.find(
    (l) => weekAge >= l.stormStart && weekAge <= l.stormEnd
  ) || null;

  // Tìm leap tiếp theo chưa bắt đầu
  const nextLeap = LEAPS.find((l) => l.stormStart > weekAge) || null;

  if (weekAge < 0 || weekAge > 80) {
    return { status: 'no_data', currentLeap: null, nextLeap: null };
  }

  return {
    status: currentLeap ? 'stormy' : 'sunny',
    currentLeap,
    nextLeap,
    weeksUntilNext: nextLeap ? nextLeap.stormStart - weekAge : null,
  };
}
