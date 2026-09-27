package com.capt4inb.babyapp;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class BabyWidgetProvider extends AppWidgetProvider {
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter
        .ofPattern("HH:mm", new Locale("vi", "VN"))
        .withZone(ZoneId.systemDefault());

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            manager.updateAppWidget(appWidgetId, createViews(context));
        }
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, BabyWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(component);
        for (int id : ids) manager.updateAppWidget(id, createViews(context));
    }

    private static RemoteViews createViews(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(BabyWidgetPlugin.PREFS_NAME, Context.MODE_PRIVATE);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.baby_widget);
        views.setTextViewText(R.id.last_feed_time, formatTime(preferences.getString(BabyWidgetPlugin.KEY_LAST_FEED, "")));
        views.setTextViewText(R.id.last_pump_time, formatTime(preferences.getString(BabyWidgetPlugin.KEY_LAST_PUMP, "")));
        views.setOnClickPendingIntent(R.id.add_feed, quickAddIntent(context, "feed", 101));
        views.setOnClickPendingIntent(R.id.add_pump, quickAddIntent(context, "pump", 102));
        return views;
    }

    private static PendingIntent quickAddIntent(Context context, String action, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("babyapp://quick-add/" + action), context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static String formatTime(String isoTimestamp) {
        if (isoTimestamp == null || isoTimestamp.isEmpty()) return "--:--";
        try {
            return TIME_FORMATTER.format(Instant.parse(isoTimestamp));
        } catch (RuntimeException ignored) {
            return "--:--";
        }
    }
}
