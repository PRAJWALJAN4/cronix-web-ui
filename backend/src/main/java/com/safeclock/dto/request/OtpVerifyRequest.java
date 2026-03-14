package com.safeclock.dto.request;

import lombok.Data;

@Data
public class OtpVerifyRequest {
    private String phoneNumber;
    private String otp;
    private String name;
    private String email;
}
