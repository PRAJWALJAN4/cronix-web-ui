package com.safeclock.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String phoneNumber;
    private String name;
    private boolean isNewUser;
    private String message;
}
