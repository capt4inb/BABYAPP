package com.capt4inb.babyapp;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BabyWidget")
public class BabyWidgetPlugin extends Plugin {
    static final String PREFS_NAME = "baby_widget";
    static final String KEY_LAST_FEED = "last_feed_at";
    static final String KEY_LAST_PUMP = "last_pump_at";

    @PluginMethod
    public void update(PluginCall call) {
        SharedPreferences preferences = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        preferences.edit()
            .putString(KEY_LAST_FEED, call.getString("lastFeedAt", ""))
            .putString(KEY_LAST_PUMP, call.getString("lastPumpAt", ""))
            .apply();

        BabyWidgetProvider.refreshAll(getContext());
        call.resolve(new JSObject());
    }
}
