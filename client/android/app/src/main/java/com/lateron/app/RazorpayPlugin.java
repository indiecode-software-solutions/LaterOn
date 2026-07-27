package com.lateron.app;

import android.app.Activity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.razorpay.Checkout;
import com.razorpay.PaymentResultWithDataListener;
import com.razorpay.PaymentData;
import org.json.JSONObject;
import org.json.JSONException;

@CapacitorPlugin(name = "RazorpayPlugin")
public class RazorpayPlugin extends Plugin {

    private PluginCall savedCall;
    private String pendingSubscriptionId;

    @PluginMethod
    public void openCheckout(PluginCall call) {
        this.savedCall = call;
        saveCall(call);

        String subscriptionId = call.getString("subscriptionId");
        String orderId        = call.getString("orderId");
        String key            = call.getString("key");
        Integer amount        = call.getInt("amount");     // in paise
        String currency       = call.getString("currency", "INR");
        String name           = call.getString("name", "LaterOn");
        String description    = call.getString("description", "Credit Pack");

        pendingSubscriptionId = subscriptionId;

        Activity activity = getActivity();

        if (!(activity instanceof PaymentResultWithDataListener)) {
            call.reject("MainActivity must implement PaymentResultWithDataListener");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                Checkout co = new Checkout();
                co.setKeyID(key);
                co.setImage(R.mipmap.ic_launcher);

                JSONObject options = new JSONObject();
                options.put("name", name);
                options.put("description", description);
                options.put("currency", currency);
                options.put("amount", amount);
                options.put("theme.color", "#1a73e8");

                if (subscriptionId != null) {
                    options.put("subscription_id", subscriptionId);
                } else if (orderId != null) {
                    options.put("order_id", orderId);
                }

                co.open(activity, options);
            } catch (JSONException e) {
                call.reject("Failed to open Razorpay checkout: " + e.getMessage());
            }
        });
    }

    /** Called by MainActivity when payment succeeds */
    public void onPaymentSuccess(String razorpayPaymentId, PaymentData paymentData) {
        if (savedCall == null) return;
        JSObject result = new JSObject();
        result.put("razorpay_payment_id", razorpayPaymentId != null ? razorpayPaymentId : (paymentData != null ? paymentData.getPaymentId() : ""));
        result.put("razorpay_order_id",   paymentData != null ? paymentData.getOrderId() : "");
        result.put("razorpay_subscription_id", pendingSubscriptionId != null ? pendingSubscriptionId : "");
        result.put("razorpay_signature",  paymentData != null ? paymentData.getSignature() : "");
        savedCall.resolve(result);
        savedCall = null;
        pendingSubscriptionId = null;
    }

    /** Called by MainActivity when payment fails */
    public void onPaymentError(int code, String description, PaymentData paymentData) {
        if (savedCall == null) return;
        savedCall.reject("Payment failed (code " + code + "): " + description);
        savedCall = null;
        pendingSubscriptionId = null;
    }
}
