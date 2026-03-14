package com.safeclock.controller;

import com.safeclock.dto.request.AdminLoginRequest;
import com.safeclock.dto.request.OtpSendRequest;
import com.safeclock.dto.request.OtpVerifyRequest;
import com.safeclock.dto.request.UpdateProfileRequest;
import com.safeclock.dto.response.ApiResponse;
import com.safeclock.dto.response.AuthResponse;
import com.safeclock.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> sendOtp(@RequestBody OtpSendRequest request) {
        authService.sendOtp(request.getPhoneNumber());
        return ResponseEntity.ok(ApiResponse.ok("OTP sent successfully",
            Map.of("message", "OTP sent", "phoneNumber", request.getPhoneNumber())));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.verifyOtpAndLogin(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/admin-login")
    public ResponseEntity<ApiResponse<AuthResponse>> adminLogin(@RequestBody AdminLoginRequest request) {
        AuthResponse response = authService.adminLogin(request);
        return ResponseEntity.ok(ApiResponse.ok("Admin login successful", response));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<String>> updateProfile(
            Authentication auth, @RequestBody UpdateProfileRequest request) {
        authService.updateProfile(auth.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", "OK"));
    }
}
