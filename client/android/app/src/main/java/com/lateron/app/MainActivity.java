package com.lateron.app;

import android.os.Bundle;
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
