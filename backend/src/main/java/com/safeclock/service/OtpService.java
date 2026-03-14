package com.safeclock.service;

import com.safeclock.entity.TokenTracker;
import com.safeclock.enums.TokenChannel;
import com.safeclock.enums.TokenFlow;
import com.safeclock.repository.TokenTrackerRepository;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final TokenTrackerRepository tokenTrackerRepository;
    private final Random random = new Random();

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.otp.max-attempts:3}")
    private int maxAttempts;

    @Value("${twilio.account-sid}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token}")
    private String twilioAuthToken;

    @Value("${twilio.phone-number}")
    private String twilioPhoneNumber;

    @PostConstruct
    public void initTwilio() {
        if (!"test_sid".equals(twilioAccountSid)) {
            Twilio.init(twilioAccountSid, twilioAuthToken);
            log.info("Twilio initialized for SMS sending.");
        }
    }

    public String generateAndSendOtp(String phoneNumber, TokenFlow flow) {
        // Invalidate old tokens
        tokenTrackerRepository
            .findTopByPhoneNumberAndVerifiedFalseOrderByExpiryTimeDesc(phoneNumber)
            .ifPresent(old -> {
                old.setVerified(true); // expire old
                tokenTrackerRepository.save(old);
            });

        String otp = String.format("%06d", random.nextInt(1000000));
        Date expiry = new Date(System.currentTimeMillis() + (long) otpExpiryMinutes * 60 * 1000);

        TokenTracker tracker = TokenTracker.builder()
                .phoneNumber(phoneNumber)
                .token(otp)
                .flow(flow)
                .channel(TokenChannel.SMS_ME)
                .expiryTime(expiry)
                .verified(false)
                .attempts(0)
                .build();

        tokenTrackerRepository.save(tracker);

        // Send OTP
        String smsBody = "Your SafeCloak OTP is: " + otp + ". It expires in " + otpExpiryMinutes + " minutes.";
        if ("test_sid".equals(twilioAccountSid)) {
            log.info("📱 [SMS MOCK] OTP for {}: {} (expires in {} min)", phoneNumber, otp, otpExpiryMinutes);
        } else {
            try {
                String toPhone = phoneNumber.startsWith("+") ? phoneNumber : "+91" + phoneNumber;
                Message message = Message.creator(
                        new PhoneNumber(toPhone),
                        new PhoneNumber(twilioPhoneNumber),
                        smsBody
                ).create();
                log.info("📱 [TWILIO] sent OTP to {} - SID: {}", toPhone, message.getSid());
            } catch (Exception e) {
                log.error("Failed to send Twilio SMS to {}: {}", phoneNumber, e.getMessage());
                // Fallback log for demo if Twilio fails
                log.info("📱 [SMS MOCK FALLBACK] OTP for {}: {}", phoneNumber, otp);
            }
        }

        return otp; // returned for demo/testing
    }

    public boolean verifyOtp(String phoneNumber, String otp) {
        Optional<TokenTracker> trackerOpt =
            tokenTrackerRepository.findTopByPhoneNumberAndVerifiedFalseOrderByExpiryTimeDesc(phoneNumber);

        if (trackerOpt.isEmpty()) return false;

        TokenTracker tracker = trackerOpt.get();

        if (tracker.getExpiryTime().before(new Date())) return false;
        if (tracker.getAttempts() >= maxAttempts) return false;

        tracker.setAttempts(tracker.getAttempts() + 1);

        if (!tracker.getToken().equals(otp)) {
            tokenTrackerRepository.save(tracker);
            return false;
        }

        tracker.setVerified(true);
        tokenTrackerRepository.save(tracker);
        return true;
    }
}
