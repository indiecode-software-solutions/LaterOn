package com.lateron.app;

import android.os.Bundle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;
import com.razorpay.PaymentResultWithDataListener;
import com.razorpay.PaymentData;

public class MainActivity extends BridgeActivity implements PaymentResultWithDataListener {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeVibrationPlugin.class);
        registerPlugin(RazorpayPlugin.class);
        super.onCreate(savedInstanceState);
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "lateron_reminders",
                "Reminders",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setSound(
                android.net.Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.bell_notification),
                new android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                    .build()
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    // ── Razorpay payment callbacks ────────────────────────────────────────────
    @Override
    public void onPaymentSuccess(String razorpayPaymentId, PaymentData paymentData) {
        PluginHandle handle = getBridge().getPlugin("RazorpayPlugin");
        if (handle != null && handle.getInstance() instanceof RazorpayPlugin) {
            ((RazorpayPlugin) handle.getInstance()).onPaymentSuccess(razorpayPaymentId, paymentData);
        }
    }

    @Override
    public void onPaymentError(int code, String description, PaymentData paymentData) {
        PluginHandle handle = getBridge().getPlugin("RazorpayPlugin");
        if (handle != null && handle.getInstance() instanceof RazorpayPlugin) {
            ((RazorpayPlugin) handle.getInstance()).onPaymentError(code, description, paymentData);
        }
    }
}
