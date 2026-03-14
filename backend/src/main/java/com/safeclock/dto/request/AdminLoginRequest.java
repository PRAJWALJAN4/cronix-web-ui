package com.safeclock.dto.request;

import lombok.Data;

@Data
public class AdminLoginRequest {
    private String phoneNumber;
    private String password;
}
