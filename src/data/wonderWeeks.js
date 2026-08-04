const DAY_MS = 24 * 60 * 60 * 1000;

export const WONDER_WEEKS = [
  {
    number: 1,
    peakWeek: 5,
    startWeek: 4,
    endWeek: 6,
    title: 'Cảm giác mới',
    summary: 'Bé bắt đầu cảm nhận ánh sáng, âm thanh, mùi và tiếp xúc rõ ràng hơn.',
    signs: ['Bám người hơn', 'Dễ quấy', 'Khó vào giấc', 'Muốn bú gần hơn'],
    observations: [
      {
        title: 'Tâm trạng & gắn kết',
        icon: 'baby',
        variant: 'pink',
        items: [
          'Có thể khóc nhiều hơn và dịu lại nhanh hơn khi được ôm hoặc nghe giọng quen.',
          'Dễ giật mình, nhăn mặt hoặc quay đi khi ánh sáng, âm thanh và tiếp xúc cùng lúc quá nhiều.',
          'Muốn ở sát người chăm sóc và có ít khoảng tỉnh táo yên lặng hơn trước.',
        ],
      },
      {
        title: 'Giấc ngủ',
        icon: 'moon',
        variant: 'blue',
        items: [
          'Có thể mất nhiều thời gian để vào giấc và cần bế, ru hoặc tiếp xúc cơ thể.',
          'Giấc ngày có thể ngắn hơn, bé dễ tỉnh khi đặt xuống hoặc khi môi trường thay đổi.',
          'Nhịp ngủ chưa ổn định; một vài ngày quấy hơn không nhất thiết tạo thành lịch mới.',
        ],
      },
      {
        title: 'Bú & ăn',
        icon: 'bottle',
        variant: 'lavender',
        items: [
          'Có thể đòi bú dày hơn để vừa ăn vừa tìm cảm giác an toàn.',
          'Một số cữ bú ngắn hoặc ngắt quãng vì bé dễ bị kích thích bởi môi trường.',
          'Theo dõi tín hiệu đói, no và lượng tã ướt thay vì ép bé theo một khung cữ cứng.',
        ],
      },
      {
        title: 'Tương tác mới',
        icon: 'sparkles',
        variant: 'green',
        items: [
          'Nhìn khuôn mặt lâu hơn và phản ứng rõ hơn với giọng nói hoặc âm thanh lớn.',
          'Có thể bắt đầu có nụ cười xã hội, nhìn xa hơn và tỉnh táo quan sát lâu hơn.',
          'Cử động tay chân nhiều hơn khi hào hứng và có những lúc mở bàn tay ngắn.',
        ],
      },
    ],
    skills: ['Nhìn khuôn mặt lâu hơn', 'Phản ứng với âm thanh', 'Tỉnh táo lâu hơn'],
    tips: ['Ôm ấp và phản hồi sớm', 'Giữ ánh sáng dịu', 'Duy trì nhịp sinh hoạt quen thuộc'],
  },
  {
    number: 2,
    peakWeek: 8,
    startWeek: 7,
    endWeek: 10,
    title: 'Nhận biết khuôn mẫu',
    summary: 'Bé dần chú ý đến các hình dáng, âm thanh và chuyển động lặp lại.',
    signs: ['Muốn được gần ba mẹ', 'Khóc nhiều hơn', 'Ngủ thất thường', 'Dễ bị quá tải'],
    observations: [
      {
        title: 'Tâm trạng & gắn kết',
        icon: 'baby',
        variant: 'pink',
        items: [
          'Có thể quấy, bám người và khó chịu nhiều hơn trong một vài ngày.',
          'Nhanh chán một tư thế, muốn được đổi góc nhìn, đi quanh phòng hoặc trò chuyện.',
          'Dễ quá tải sau thời gian tương tác dài và cần một khoảng yên tĩnh để hồi phục.',
        ],
      },
      {
        title: 'Giấc ngủ',
        icon: 'moon',
        variant: 'blue',
        items: [
          'Có thể chống lại giấc ngày dù đã buồn ngủ hoặc chỉ ngủ thành những giấc ngắn.',
          'Bé dễ thức khi chuyển từ tay người chăm sóc xuống nệm.',
          'Nghi thức ngủ lặp lại, ánh sáng dịu và ít kích thích có thể giúp bé dễ đoán điều sắp tới.',
        ],
      },
      {
        title: 'Bú & ăn',
        icon: 'bottle',
        variant: 'lavender',
        items: [
          'Nhịp bú có thể kém đều, có lúc bú dồn và có lúc nhanh mất tập trung.',
          'Bé có thể muốn mút để tự trấn an ngay cả khi vừa hoàn thành cữ.',
          'Tạm giảm âm thanh và chuyển động quanh bé nếu cữ bú thường xuyên bị ngắt.',
        ],
      },
      {
        title: 'Tương tác mới',
        icon: 'sparkles',
        variant: 'green',
        items: [
          'Chú ý bàn tay, bóng sáng, hình tương phản và các mẫu hình lặp lại.',
          'Cử động tay chân bớt phản xạ, có nhịp và có chủ đích hơn.',
          'Có thể đáp lại giọng nói bằng nét mặt, nụ cười hoặc tiếng ê a.',
        ],
      },
    ],
    skills: ['Nhìn theo đồ vật', 'Nhận ra giọng quen', 'Cử động tay chân có nhịp'],
    tips: ['Trò chuyện chậm rãi', 'Cho bé xem hình tương phản', 'Tạo khoảng nghỉ yên tĩnh'],
  },
  {
    number: 3,
    peakWeek: 12,
    startWeek: 11,
    endWeek: 13,
    title: 'Chuyển động trôi chảy',
    summary: 'Bé cảm nhận tốt hơn những thay đổi liên tục trong giọng nói và chuyển động.',
    signs: ['Hay giật mình', 'Cần dỗ lâu hơn', 'Ít tự chơi', 'Nhịp bú thay đổi'],
    observations: [
      {
        title: 'Tâm trạng & gắn kết',
        icon: 'baby',
        variant: 'pink',
        items: [
          'Có thể dè dặt hơn với người lạ, muốn được bế và cần người quen ở gần.',
          'Dễ quấy khi trò chơi dừng lại hoặc khi không còn nhìn thấy người chăm sóc.',
          'Mút tay nhiều hơn có thể là cách bé tự làm dịu trong lúc căng thẳng.',
        ],
      },
      {
        title: 'Giấc ngủ',
        icon: 'moon',
        variant: 'blue',
        items: [
          'Có thể thức nhiều lần hơn hoặc chỉ duy trì được các quãng ngủ ngắn.',
          'Bé nhạy với thay đổi âm thanh, ánh sáng và chuyển động khi đang lim dim.',
          'Một chuỗi thao tác quen thuộc trước ngủ giúp giảm bớt những chuyển đổi đột ngột.',
        ],
      },
      {
        title: 'Bú & ăn',
        icon: 'bottle',
        variant: 'lavender',
        items: [
          'Sự thèm bú có thể giảm tạm thời hoặc cữ bú bị chia thành nhiều đoạn.',
          'Bé có thể dừng bú để lắng nghe, nhìn quanh rồi mới tiếp tục.',
          'Ưu tiên theo tín hiệu đói và no của bé, đồng thời theo dõi tổng lượng trong ngày.',
        ],
      },
      {
        title: 'Tương tác mới',
        icon: 'sparkles',
        variant: 'green',
        items: [
          'Theo dõi chuyển động mượt hơn và nhận ra thay đổi dần trong giọng nói hoặc ánh sáng.',
          'Ê a với nhiều cao độ, quay về phía giọng nói và thích đối thoại qua lại.',
          'Kiểm soát đầu tốt hơn khi được bế và khi nằm sấp lúc đang tỉnh.',
        ],
      },
    ],
    skills: ['Theo dõi chuyển động mượt', 'Đổi cao độ khi ê a', 'Điều khiển đầu tốt hơn'],
    tips: ['Di chuyển đồ chơi thật chậm', 'Đáp lại tiếng ê a', 'Cho bé nằm sấp khi tỉnh'],
  },
  {
    number: 4,
    peakWeek: 19,
    startWeek: 14,
    endWeek: 20,
    title: 'Những sự kiện nhỏ',
    summary: 'Bé bắt đầu liên kết các hành động ngắn và nhận ra điều gì sẽ xảy ra tiếp theo.',
    signs: ['Quấy khi rời người chăm', 'Dễ tỉnh giấc', 'Muốn bú nhiều lần', 'Cần được chú ý'],
    observations: [
      {
        title: 'Tâm trạng & gắn kết',
        icon: 'baby',
        variant: 'pink',
        items: [
          'Giai đoạn quấy có thể kéo dài hơn; bé cần được chú ý và nhanh phản đối khi trò chơi dừng.',
          'Có thể khó chịu khi người chăm sóc đi khỏi tầm nhìn dù chỉ trong thời gian ngắn.',
          'Khoảng tập trung còn ngắn, vì vậy bé có thể đổi nhanh từ hào hứng sang mệt mỏi.',
        ],
      },
      {
        title: 'Giấc ngủ',
        icon: 'moon',
        variant: 'blue',
        items: [
          'Giấc ngủ có thể phân mảnh hơn khi cấu trúc ngủ của bé đang trưởng thành.',
          'Bé có thể cần hỗ trợ nhiều hơn để nối giấc ngày hoặc ngủ lại vào ban đêm.',
          'Duy trì giờ thức phù hợp và một nghi thức ngủ nhất quán thay vì kéo dài thời gian thức.',
        ],
      },
      {
        title: 'Bú & ăn',
        icon: 'bottle',
        variant: 'lavender',
        items: [
          'Có thể bú ngắn, bú dồn hoặc quay ra quan sát môi trường giữa cữ.',
          'Bé dễ sao nhãng bởi giọng nói, ánh sáng và chuyển động quanh nơi bú.',
          'Một không gian ít kích thích thường giúp cữ bú liền mạch hơn.',
        ],
      },
      {
        title: 'Tương tác mới',
        icon: 'sparkles',
        variant: 'green',
        items: [
          'Chủ động với, quơ và nắm đồ vật; đặc biệt chú ý bàn tay và bàn chân.',
          'Có thể cười thành tiếng, bập bẹ nhiều hơn và hào hứng với bài hát quen.',
          'Bắt đầu nhận ra chuỗi nguyên nhân - kết quả đơn giản trong trò chơi lặp lại.',
        ],
      },
    ],
    skills: ['Với và nắm đồ vật', 'Quan sát nguyên nhân - kết quả', 'Cười thành tiếng'],
    tips: ['Chơi ú òa ngắn', 'Cho bé chạm đồ vật an toàn', 'Giữ nghi thức ngủ ổn định'],
  },
  {
    number: 5,
    peakWeek: 26,
    startWeek: 22,
    endWeek: 27,
    title: 'Các mối quan hệ',
    summary: 'Bé dần hiểu khoảng cách giữa mình, người thân và những đồ vật xung quanh.',
    signs: ['Lo khi xa ba mẹ', 'Khó ngủ một mình', 'Dễ cáu gắt', 'Đòi bế nhiều hơn'],
    observations: [
      {
        title: 'Tâm trạng & gắn kết',
        icon: 'baby',
        variant: 'pink',
        items: [
          'Có thể phản đối mạnh khi người chăm sóc ra khỏi tầm mắt vì đã nhận ra khoảng cách.',
          'Dè dặt hơn với người lạ, giơ tay đòi bế hoặc liên tục kiểm tra người quen còn ở đó.',
          'Lo âu xa cách ở độ tuổi này thường là một phần phát triển bình thường.',
        ],
      },
      {
        title: 'Giấc ngủ',
        icon: 'moon',
        variant: 'blue',
        items: [
          'Có thể tỉnh để tìm người chăm sóc hoặc khó chịu ngay khi được đặt xuống.',
          'Bé cần sự hiện diện quen thuộc để bình tĩnh nhưng vẫn có thể tập lại nhịp ngủ từng bước.',
          'Trò chơi ú òa ban ngày giúp bé làm quen với việc một người biến mất rồi quay lại.',
        ],
      },
      {
        title: 'Bú & ăn',
        icon: 'bottle',
        variant: 'lavender',
        items: [
          'Bé có thể bú để trấn an hoặc bỏ dở cữ khi có người và vật di chuyển gần đó.',
          'Có thể khép môi, quay đầu khi no và đưa đồ vật an toàn lên miệng để khám phá.',
          'Hãy cho bé thời gian phản hồi thay vì cố hoàn thành một lượng cố định trong từng cữ.',
        ],
      },
      {
        title: 'Tương tác mới',
        icon: 'sparkles',
        variant: 'green',
        items: [
          'Khám phá quan hệ trong, ngoài, trên, dưới và thích lấy đồ khỏi hộp rồi bỏ lại.',
          'Chuyển đồ giữa hai tay, với chính xác hơn và tìm món đồ bị che một phần.',
          'Có thể lăn, chống tay và tập ngồi với hỗ trợ để thay đổi khoảng cách tới đồ vật.',
        ],
      },
    ],
    skills: ['Tìm đồ vật bị che', 'Ước lượng khoảng cách', 'Chuyển đồ giữa hai tay'],
    tips: ['Báo cho bé trước khi rời đi', 'Chơi giấu đồ đơn giản', 'Đặt đồ chơi vừa tầm với'],
  },
  {
    number: 6,
    peakWeek: 37,
    startWeek: 33,
    endWeek: 38,
    title: 'Phân loại thế giới',
    summary: 'Bé thử nhóm các đồ vật, âm thanh và con người theo điểm giống nhau.',
    signs: ['Kén ăn hơn', 'Không thích thay tã', 'Bám người quen', 'Dễ phản đối'],
    observations: [
      {
        title: 'Tâm trạng & gắn kết',
        icon: 'baby',
        variant: 'pink',
        items: [
          'Có thể phản đối việc phải nằm yên, đặc biệt khi thay tã hoặc thay quần áo.',
          'Bám người quen, dè dặt với người lạ và nhạy hơn với nét mặt của người đối diện.',
          'Dễ cáu khi bị ngăn khám phá một vật đang gây chú ý.',
        ],
      },
      {
        title: 'Giấc ngủ',
        icon: 'moon',
        variant: 'blue',
        items: [
          'Có thể khó nằm yên vì muốn tiếp tục luyện ngồi, trườn hoặc với đồ vật.',
          'Giấc ngày ngắn hoặc thức đêm có thể xuất hiện trong những ngày vận động nhiều.',
          'Cho bé thời gian vận động khi tỉnh và giảm kích thích dần trước giờ ngủ.',
        ],
      },
      {
        title: 'Bú & ăn',
        icon: 'bottle',
        variant: 'lavender',
        items: [
          'Bé có thể kén hơn, phản ứng với kết cấu mới hoặc muốn tự cầm thức ăn.',
          'Bữa ăn dễ trở thành lúc tranh quyền kiểm soát nếu bé bị ép tiếp tục khi đã quay đi.',
          'Giới thiệu món mới cùng món quen và cho bé khám phá bằng tay trong phạm vi an toàn.',
        ],
      },
      {
        title: 'Tương tác mới',
        icon: 'sparkles',
        variant: 'green',
        items: [
          'So sánh và phân loại người, động vật, đồ vật theo đặc điểm giống và khác nhau.',
          'Quan sát kích thước, trọng lượng, bề mặt và các chi tiết nhỏ kỹ hơn.',
          'Có thể đáp lại tên, ngồi vững hơn, đập hai đồ vật và chuyển đồ giữa hai tay.',
        ],
      },
    ],
    skills: ['Nhận ra nhóm đồ vật', 'Quan sát chi tiết nhỏ', 'Bắt chước nét mặt'],
    tips: ['Gọi tên đồ vật hằng ngày', 'Cho bé khám phá nhiều chất liệu', 'Giữ giới hạn nhẹ nhàng'],
  },
  {
    number: 7,
    peakWeek: 46,
    startWeek: 41,
    endWeek: 47,
    title: 'Trình tự hành động',
    summary: 'Bé hiểu rằng một việc thường gồm nhiều bước theo thứ tự.',
    signs: ['Dễ mất kiên nhẫn', 'Muốn làm theo ý mình', 'Ngủ chập chờn', 'Đòi tương tác nhiều'],
    observations: [
      {
        title: 'Tâm trạng & gắn kết',
        icon: 'baby',
        variant: 'pink',
        items: [
          'Có thể muốn tiếp xúc cơ thể nhiều hơn, dè dặt và liên tục tìm sự tương tác.',
          'Phản đối khi một hành động quen thuộc bị dừng giữa chừng hoặc đồ vật bị lấy đi.',
          'Muốn tự thử nhưng nhanh mất kiên nhẫn khi chưa hoàn thành được mục tiêu.',
        ],
      },
      {
        title: 'Giấc ngủ',
        icon: 'moon',
        variant: 'blue',
        items: [
          'Có thể ngủ ít hơn, thức đêm hoặc có những lần tỉnh đầy bất an.',
          'Bé dễ muốn đứng hoặc ngồi dậy để luyện kỹ năng ngay trong chỗ ngủ.',
          'Lặp cùng một trình tự trước ngủ giúp báo hiệu rõ rằng hoạt động trong ngày đã kết thúc.',
        ],
      },
      {
        title: 'Bú & ăn',
        icon: 'bottle',
        variant: 'lavender',
        items: [
          'Có thể muốn tự cầm, bốc hoặc làm lại các bước quen thuộc trong bữa ăn.',
          'Bé dễ bực nếu bị giúp quá nhanh nhưng cũng có thể cần hỗ trợ khi mệt.',
          'Cho phép khám phá trong giới hạn an toàn và báo trước khi kết thúc bữa.',
        ],
      },
      {
        title: 'Tương tác mới',
        icon: 'sparkles',
        variant: 'green',
        items: [
          'Hiểu chuỗi hành động: lấy đồ, đặt vào, đóng lại hoặc xếp từng phần theo thứ tự.',
          'Chỉ tay, bắt chước thao tác đơn giản và chủ động thử lại để đạt mục tiêu.',
          'Có thể kéo đứng, vịn di chuyển hoặc dùng nhiều cách khác nhau để tới món đồ mong muốn.',
        ],
      },
    ],
    skills: ['Xếp hành động theo bước', 'Bắt chước việc đơn giản', 'Cố đạt mục tiêu'],
    tips: ['Cho bé tự thử trước khi giúp', 'Chơi xếp và tháo đồ', 'Nói từng bước khi làm việc'],
  },
  {
    number: 8,
    peakWeek: 55,
    startWeek: 51,
    endWeek: 56,
    title: 'Lập kế hoạch đơn giản',
    summary: 'Bé bắt đầu kết hợp nhiều hành động để đạt một mục tiêu quen thuộc.',
    signs: ['Thử giới hạn nhiều hơn', 'Khó chuyển hoạt động', 'Hay mè nheo', 'Cần được trấn an'],
    observations: [
      {
        title: 'Tâm trạng & gắn kết',
        icon: 'baby',
        variant: 'pink',
        items: [
          'Có thể thay đổi tâm trạng nhanh, ghen, bám người và dè dặt hơn bình thường.',
          'Khó chuyển sang hoạt động khác và phản ứng mạnh khi kế hoạch của bé bị gián đoạn.',
          'Muốn được giải trí liên tục nhưng cũng dễ mệt vì quá nhiều tương tác.',
        ],
      },
      {
        title: 'Giấc ngủ',
        icon: 'moon',
        variant: 'blue',
        items: [
          'Có thể xuất hiện những đêm thức nhiều, khó vào giấc hoặc tỉnh sớm.',
          'Bé có thể cần kiểm tra người chăm sóc vẫn ở gần sau khi thức dậy.',
          'Báo trước giờ ngủ và giữ trình tự ổn định giúp việc chuyển hoạt động bớt đột ngột.',
        ],
      },
      {
        title: 'Bú & ăn',
        icon: 'bottle',
        variant: 'lavender',
        items: [
          'Nhu cầu tự làm tăng lên; bé có thể từ chối trợ giúp dù chưa thao tác thành thạo.',
          'Sở thích món ăn có thể thay đổi theo ngày và bé dễ mất kiên nhẫn khi chờ.',
          'Cho hai lựa chọn phù hợp giúp bé có quyền chủ động mà bữa ăn vẫn có giới hạn.',
        ],
      },
      {
        title: 'Tương tác mới',
        icon: 'sparkles',
        variant: 'green',
        items: [
          'Kết hợp nhiều bước thành một “chương trình” quen thuộc như lấy đồ rồi mang tới.',
          'Thích bắt chước việc nhà, dùng đồ vật đúng công dụng và chơi giả vờ đơn giản.',
          'Có thể vẫy tay, tìm đồ bị giấu, bỏ đồ vào hộp và hiểu lời từ chối ngắn.',
        ],
      },
    ],
    skills: ['Chọn cách đạt mục tiêu', 'Chơi giả vờ đơn giản', 'Làm theo hướng dẫn ngắn'],
    tips: ['Báo trước khi đổi hoạt động', 'Cho hai lựa chọn phù hợp', 'Khuyến khích chơi đóng vai'],
  },
  {
    number: 9,
    peakWeek: 64,
    startWeek: 59,
    endWeek: 65,
    title: 'Những nguyên tắc',
    summary: 'Bé thử tìm quy tắc, ngoại lệ và cách ứng xử trong nhiều tình huống.',
    signs: ['Dễ nổi giận', 'Muốn tự quyết', 'Thay đổi khẩu vị', 'Khó chấp nhận chờ đợi'],
    observations: [
      {
        title: 'Tâm trạng & gắn kết',
        icon: 'baby',
        variant: 'pink',
        items: [
          'Có thể thiếu kiên nhẫn, bực hoặc nổi giận khi bị từ chối hay đồ vật bị lấy đi.',
          'Muốn tự quyết nhiều hơn nhưng vẫn cần người chăm sóc hỗ trợ điều hòa cảm xúc.',
          'Cơn ăn vạ có thể xuất hiện thường hơn khi bé mệt, đói hoặc phải chờ lâu.',
        ],
      },
      {
        title: 'Giấc ngủ',
        icon: 'moon',
        variant: 'blue',
        items: [
          'Có thể phản đối chuyển từ chơi sang ngủ và thử xem giới hạn giờ ngủ có thay đổi không.',
          'Những lựa chọn nhỏ như chọn sách hoặc đồ ngủ giúp bé hợp tác hơn.',
          'Giữ cách phản hồi bình tĩnh, ngắn và nhất quán khi bé thức lại.',
        ],
      },
      {
        title: 'Bú & ăn',
        icon: 'bottle',
        variant: 'lavender',
        items: [
          'Có thể đòi tự xúc, tự cầm cốc hoặc chỉ chấp nhận một vài món quen.',
          'Từ chối món ăn đôi khi là cách thử nguyên tắc hơn là dấu hiệu bé hoàn toàn không thích món đó.',
          'Tiếp tục giới thiệu đa dạng, không ép và duy trì giờ ăn tương đối ổn định.',
        ],
      },
      {
        title: 'Tương tác mới',
        icon: 'sparkles',
        variant: 'green',
        items: [
          'Bắt đầu lập chiến lược, dự đoán kết quả và thay đổi cách làm sau một lần chưa thành công.',
          'Bắt chước vai trò, dùng đồ vật đúng cách và hiểu những quy tắc rất ngắn.',
          'Có thể nói vài từ, chỉ để nhờ giúp, xếp hai khối và bước đi độc lập hơn.',
        ],
      },
    ],
    skills: ['Hiểu quy tắc đơn giản', 'Bắt chước vai trò', 'Dự đoán kết quả quen thuộc'],
    tips: ['Giữ quy tắc ngắn và nhất quán', 'Gọi tên cảm xúc', 'Khen nỗ lực cụ thể'],
  },
  {
    number: 10,
    peakWeek: 75,
    startWeek: 70,
    endWeek: 76,
    title: 'Kết nối thành hệ thống',
    summary: 'Bé phối hợp nhiều nguyên tắc và hiểu các nhóm sự việc phức tạp hơn.',
    signs: ['Khẳng định ý muốn mạnh', 'Dễ thất vọng', 'Cần gần người thân', 'Nếp ngủ thay đổi'],
    observations: [
      {
        title: 'Tâm trạng & gắn kết',
        icon: 'baby',
        variant: 'pink',
        items: [
          'Nhu cầu tự lập rõ hơn; bé có thể thất vọng mạnh khi không tự hoàn thành được việc.',
          'Có thể rời người chăm sóc để khám phá rồi quay lại kiểm tra người thân vẫn ở gần.',
          'Bé bắt đầu thể hiện sở thích, ý muốn và phản ứng riêng rõ ràng hơn.',
        ],
      },
      {
        title: 'Giấc ngủ',
        icon: 'moon',
        variant: 'blue',
        items: [
          'Có thể phản đối giờ ngủ vì muốn tiếp tục tự chơi hoặc hoàn thành hoạt động đang làm.',
          'Thay đổi lịch đột ngột có thể khiến bé khó hợp tác trong vài ngày.',
          'Lịch ổn định và báo trước từng bước giúp bé hình dung trình tự sắp tới.',
        ],
      },
      {
        title: 'Bú & ăn',
        icon: 'bottle',
        variant: 'lavender',
        items: [
          'Muốn dùng thìa, cốc và tự ăn dù còn làm đổ hoặc cần nhiều thời gian.',
          'Có thể đưa ra lựa chọn mạnh và phản đối khi không được chọn món hoặc dụng cụ.',
          'Cho hai lựa chọn an toàn và để bé tham gia những bước nhỏ như đặt cốc lên bàn.',
        ],
      },
      {
        title: 'Tương tác mới',
        icon: 'sparkles',
        variant: 'green',
        items: [
          'Nhận biết tốt hơn về bản thân, trình tự thời gian, âm nhạc và các thói quen gia đình.',
          'Có thể làm theo chỉ dẫn một bước, bắt chước việc nhà và chơi với đồ vật linh hoạt hơn.',
          'Ngôn ngữ, đi bộ, leo thấp và vẽ nguệch ngoạc có thể tiến bộ rõ trong giai đoạn này.',
        ],
      },
    ],
    skills: ['Kết hợp nhiều bước', 'Hiểu quan hệ trong nhóm', 'Chủ động giải quyết vấn đề'],
    tips: ['Chia nhiệm vụ thành bước nhỏ', 'Cho bé thời gian tự làm', 'Giữ ranh giới bình tĩnh'],
  },
];

function toLocalDate(dateLike) {
  if (!dateLike) return null;

  if (dateLike instanceof Date) {
    if (Number.isNaN(dateLike.getTime())) return null;
    return new Date(dateLike.getFullYear(), dateLike.getMonth(), dateLike.getDate(), 12);
  }

  const match = String(dateLike).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function addCalendarDays(dateLike, days) {
  const date = toLocalDate(dateLike);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return date;
}

export function formatWonderDate(dateLike, options = {}) {
  const date = toLocalDate(dateLike);
  if (!date) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    ...options,
  }).format(date);
}

export function getLeapTiming(leap, dueDate, today = new Date()) {
  const due = toLocalDate(dueDate);
  const currentDay = toLocalDate(today);
  if (!due || !currentDay) return null;

  const ageDays = Math.floor((currentDay.getTime() - due.getTime()) / DAY_MS);
  const startDay = leap.startWeek * 7;
  const endDay = leap.endWeek * 7 - 1;
  const startDate = addCalendarDays(due, startDay);
  const endDate = addCalendarDays(due, endDay);
  let state = 'upcoming';

  if (ageDays >= startDay && ageDays <= endDay) state = 'active';
  if (ageDays > endDay) state = 'passed';

  const totalDays = Math.max(1, endDay - startDay + 1);
  const elapsedDays = Math.min(totalDays, Math.max(0, ageDays - startDay + 1));

  return {
    ...leap,
    ageDays,
    startDay,
    endDay,
    startDate,
    endDate,
    state,
    daysUntil: Math.max(0, startDay - ageDays),
    daysRemaining: Math.max(0, endDay - ageDays + 1),
    progress: Math.round((elapsedDays / totalDays) * 100),
  };
}

export function getWonderWeekState(dueDate, today = new Date()) {
  const timeline = WONDER_WEEKS
    .map(leap => getLeapTiming(leap, dueDate, today))
    .filter(Boolean);

  if (timeline.length === 0) return null;

  const current = timeline.find(leap => leap.state === 'active') || null;
  const next = timeline.find(leap => leap.state === 'upcoming') || null;
  const latestPassed = [...timeline].reverse().find(leap => leap.state === 'passed') || null;
  const ageDays = timeline[0].ageDays;

  return {
    ageDays,
    ageWeek: ageDays < 0 ? 0 : Math.floor(ageDays / 7),
    timeline,
    current,
    next,
    latestPassed,
    focus: current || next || latestPassed || timeline[0],
    status: current ? 'active' : next ? 'waiting' : 'completed',
  };
}
