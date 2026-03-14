package com.safeclock.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    public void sendPickupNotification(String phoneNumber, String orderId, String boxName,
                                        String accessCode, String terminalAddress) {
        log.info("📧 [NOTIFICATION] Sending pickup notification to {}", phoneNumber);
        log.info("  Order: {} | Box: {} | Code: {} | Location: {}",
                orderId, boxName, accessCode, terminalAddress);
        // In production: integrate SMS (Twilio/AWS SNS) and email service
    }

    public void sendOrderConfirmation(String phoneNumber, String orderId, String boxName) {
        log.info("✅ [NOTIFICATION] Order confirmed for {} - Order: {}, Box: {}",
                phoneNumber, orderId, boxName);
    }

    public void sendPickupReminder(String phoneNumber, String orderId, String boxName, String expiryTime) {
        log.info("⏰ [NOTIFICATION] Reminder for {} - Order: {} expires at {}",
                phoneNumber, orderId, expiryTime);
    }

    public void sendBoxAccessCode(String phoneNumber, String otp, String boxName) {
        log.info("🔑 [NOTIFICATION] Box access OTP for {} - Box: {} | OTP: {}",
                phoneNumber, boxName, otp);
    }
}
