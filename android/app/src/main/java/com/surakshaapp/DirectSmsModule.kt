package com.surakshaapp

import android.telephony.SmsManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DirectSmsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DirectSms"
    }

    @ReactMethod
    fun sendDirectSms(phoneNumber: String, message: String, promise: Promise) {
        try {
            val smsManager: SmsManager = SmsManager.getDefault()
            val parts = smsManager.divideMessage(message)
            smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
            promise.resolve("SMS Sent Successfully to $phoneNumber")
        } catch (e: Exception) {
            promise.reject("SMS_ERROR", e.message ?: "Unknown SMS Error")
        }
    }
}
