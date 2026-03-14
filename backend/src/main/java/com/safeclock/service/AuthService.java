package com.safeclock.service;

import com.safeclock.dto.request.AdminLoginRequest;
import com.safeclock.dto.request.OtpVerifyRequest;
import com.safeclock.dto.request.UpdateProfileRequest;
import com.safeclock.dto.response.AuthResponse;
import com.safeclock.entity.Role;
import com.safeclock.entity.User;
import com.safeclock.enums.TokenFlow;
import com.safeclock.repository.RoleRepository;
import com.safeclock.repository.UserRepository;
import com.safeclock.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OtpService otpService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public String sendOtp(String phoneNumber) {
        return otpService.generateAndSendOtp(phoneNumber, TokenFlow.LOGIN_SMS_OTP);
    }

    public AuthResponse verifyOtpAndLogin(OtpVerifyRequest request) {
        boolean valid = otpService.verifyOtp(request.getPhoneNumber(), request.getOtp());
        if (!valid) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        // Get or create user
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseGet(() -> createNewUser(request.getPhoneNumber()));

        user.setVerified(true);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getPhoneNumber());
        return AuthResponse.builder()
                .token(token)
                .phoneNumber(user.getPhoneNumber())
                .name(user.getName())
                .isNewUser(user.getName() == null || user.getName().isBlank())
                .build();
    }

    public AuthResponse adminLogin(AdminLoginRequest request) {
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        boolean hasAdminRole = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));

        if (!hasAdminRole) throw new RuntimeException("Not an admin");

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getPhoneNumber());
        return AuthResponse.builder()
                .token(token)
                .phoneNumber(user.getPhoneNumber())
                .name(user.getName())
                .isNewUser(false)
                .build();
    }

    public void updateProfile(String phoneNumber, UpdateProfileRequest request) {
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        userRepository.save(user);
    }

    private User createNewUser(String phoneNumber) {
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("ROLE_USER not found"));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        User user = User.builder()
                .phoneNumber(phoneNumber)
                .verified(false)
                .enabled(true)
                .roles(roles)
                .build();

        return userRepository.save(user);
    }
}
