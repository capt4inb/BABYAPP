import Capacitor
import WidgetKit

@objc(BabyWidgetPlugin)
public class BabyWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BabyWidgetPlugin"
    public let jsName = "BabyWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    private let appGroup = "group.com.capt4inb.babyapp"

    @objc func update(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: appGroup) else {
            call.reject("Không thể mở App Group cho widget")
            return
        }

        defaults.set(call.getString("lastFeedAt") ?? "", forKey: "last_feed_at")
        defaults.set(call.getString("lastPumpAt") ?? "", forKey: "last_pump_at")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
