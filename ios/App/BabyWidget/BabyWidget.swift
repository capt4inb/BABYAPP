import SwiftUI
import WidgetKit

private let appGroup = "group.com.capt4inb.babyapp"

struct BabyWidgetEntry: TimelineEntry {
    let date: Date
    let lastFeedAt: Date?
    let lastPumpAt: Date?
}

struct BabyWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> BabyWidgetEntry {
        BabyWidgetEntry(date: Date(), lastFeedAt: Date(), lastPumpAt: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (BabyWidgetEntry) -> Void) {
        completion(readEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BabyWidgetEntry>) -> Void) {
        completion(Timeline(entries: [readEntry()], policy: .never))
    }

    private func readEntry() -> BabyWidgetEntry {
        let defaults = UserDefaults(suiteName: appGroup)
        return BabyWidgetEntry(
            date: Date(),
            lastFeedAt: parse(defaults?.string(forKey: "last_feed_at")),
            lastPumpAt: parse(defaults?.string(forKey: "last_pump_at"))
        )
    }

    private func parse(_ value: String?) -> Date? {
        guard let value, !value.isEmpty else { return nil }
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return fractional.date(from: value) ?? ISO8601DateFormatter().date(from: value)
    }
}

struct BabyWidgetView: View {
    let entry: BabyWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Baby Milk Tracker")
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color(red: 0.26, green: 0.23, blue: 0.36))

            HStack(spacing: 18) {
                item(title: "Bú gần nhất", date: entry.lastFeedAt, action: "feed", tint: Color(red: 0.36, green: 0.43, blue: 0.88))
                item(title: "Hút gần nhất", date: entry.lastPumpAt, action: "pump", tint: Color(red: 0.71, green: 0.38, blue: 0.52))
            }
        }
        .padding(16)
        .babyWidgetBackground()
    }

    private func item(title: String, date: Date?, action: String, tint: Color) -> some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Text(date.map(Self.timeFormatter.string) ?? "--:--")
                    .font(.title2.bold())
                    .foregroundStyle(Color(red: 0.26, green: 0.23, blue: 0.36))
            }
            Spacer(minLength: 0)
            Link(destination: URL(string: "babyapp://quick-add/\(action)")!) {
                Image(systemName: "plus")
                    .font(.headline.bold())
                    .foregroundStyle(.white)
                    .frame(width: 38, height: 38)
                    .background(tint, in: Circle())
            }
            .accessibilityLabel(action == "feed" ? "Thêm cữ bú" : "Ghi giờ hút")
        }
        .frame(maxWidth: .infinity)
    }

    private static let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "vi_VN")
        formatter.dateFormat = "HH:mm"
        return formatter
    }()
}

private extension View {
    @ViewBuilder
    func babyWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) {
                Color(red: 1.0, green: 0.973, blue: 0.961)
            }
        } else {
            background(Color(red: 1.0, green: 0.973, blue: 0.961))
        }
    }
}

struct BabyMilkWidget: Widget {
    let kind = "BabyMilkWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BabyWidgetProvider()) { entry in
            BabyWidgetView(entry: entry)
        }
        .configurationDisplayName("Giờ bú và hút sữa")
        .description("Xem giờ gần nhất và thêm nhanh từ màn hình chính.")
        .supportedFamilies([.systemMedium])
    }
}
