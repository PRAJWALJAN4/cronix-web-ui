package com.safeclock.controller;

import com.safeclock.dto.request.AllocateBoxRequest;
import com.safeclock.dto.response.ApiResponse;
import com.safeclock.entity.Box;
import com.safeclock.entity.Orders;
import com.safeclock.entity.Terminal;
import com.safeclock.entity.User;
import com.safeclock.enums.TerminalStatus;
import com.safeclock.repository.SiteRepository;
import com.safeclock.repository.TerminalRepository;
import com.safeclock.repository.UserRepository;
import com.safeclock.service.AllocationService;
import com.safeclock.service.BoxAccessService;
import com.safeclock.service.BoxService;
import com.safeclock.service.OrderService;
import com.safeclock.repository.TerminalMetaDataRepository;
import com.safeclock.service.BoxService;
import com.safeclock.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final TerminalRepository terminalRepository;
    private final UserRepository userRepository;
    private final SiteRepository siteRepository;
    private final BoxService boxService;
    private final AllocationService allocationService;
    private final OrderService orderService;
    private final BoxAccessService boxAccessService;
    private final TerminalMetaDataRepository terminalMetaDataRepository;

    // ===== TERMINALS =====
    @GetMapping("/terminals")
    public ResponseEntity<ApiResponse<List<Terminal>>> getActiveTerminals() {
        List<Terminal> terminals = terminalRepository.findByStatus(TerminalStatus.ACTIVE);
        for (Terminal t : terminals) {
            siteRepository.findById(t.getSiteIdRef()).ifPresent(s -> {
                t.setLatitude(s.getLatitude());
                t.setLongitude(s.getLongitude());
            });
        }
        return ResponseEntity.ok(ApiResponse.ok(terminals));
    }

    @GetMapping("/terminals/{id}")
    public ResponseEntity<ApiResponse<Terminal>> getTerminal(@PathVariable String id) {
        Terminal terminal = terminalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Terminal not found"));
        return ResponseEntity.ok(ApiResponse.ok(terminal));
    }

    // ===== BOXES =====
    @GetMapping("/terminals/{id}/boxes")
    public ResponseEntity<ApiResponse<List<Box>>> getBoxLayout(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(boxService.getBoxesByTerminal(id)));
    }

    @GetMapping("/terminals/{id}/metadata")
    public ResponseEntity<ApiResponse<com.safeclock.entity.TerminalMetaData>> getTerminalMetadata(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(
            terminalMetaDataRepository.findFirstByTerminalIdOrderByUpdatedAtDesc(id)
                .orElse(null)
        ));
    }

    @GetMapping("/terminals/{id}/boxes/available")
    public ResponseEntity<ApiResponse<List<Box>>> getAvailableBoxes(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(boxService.getAvailableBoxes(id)));
    }

    // ===== ALLOCATION (core feature) =====
    @PostMapping("/allocate")
    public ResponseEntity<ApiResponse<Orders>> allocateBox(
            Authentication auth, @RequestBody AllocateBoxRequest request) {
        String phoneNumber = auth.getName();
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Orders order = allocationService.allocateBox(user.getId(), request.getTerminalId(), request.getBoxId(), request.getDurationHours());
        return ResponseEntity.ok(ApiResponse.ok("Box allocated successfully", order));
    }

    // ===== ORDERS =====
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<Orders>>> getMyOrders(Authentication auth) {
        User user = userRepository.findByPhoneNumber(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok(orderService.getUserOrders(user.getId())));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<Orders>> getOrder(@PathVariable String orderId) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrder(orderId)));
    }

    @PostMapping("/orders/{orderId}/dropoff")
    public ResponseEntity<ApiResponse<Orders>> processDropoff(
            Authentication auth, @PathVariable String orderId, @RequestBody Map<String, String> body) {
        Orders order = orderService.processDropoff(orderId, body.get("code"));
        return ResponseEntity.ok(ApiResponse.ok("Drop-off verified. Box securely locked.", order));
    }

    @PostMapping("/orders/{orderId}/pickup-otp")
    public ResponseEntity<ApiResponse<Orders>> requestPickupOtp(
            Authentication auth, @PathVariable String orderId) {
        User user = userRepository.findByPhoneNumber(auth.getName()).orElseThrow();
        Orders order = orderService.generateAndSendPickupOtp(orderId, user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Pick-up OTP sent to registered mobile number", order));
    }

    @PostMapping("/orders/{orderId}/pickup")
    public ResponseEntity<ApiResponse<Object>> processPickup(
            Authentication auth, @PathVariable String orderId, @RequestBody Map<String, String> body) {
        User user = userRepository.findByPhoneNumber(auth.getName()).orElseThrow();
        boolean paymentDone = "true".equals(body.get("paymentDone"));
        try {
            Orders order = orderService.processPickup(orderId, user.getId(), body.get("code"), paymentDone);
            return ResponseEntity.ok(ApiResponse.ok("Pickup completed. Box Unlocked.", order));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().startsWith("PAYMENT_REQUIRED:")) {
                String amount = e.getMessage().split(":")[1];
                return ResponseEntity.badRequest().body(ApiResponse.error("Payment required", Map.of("amountDue", Double.parseDouble(amount))));
            }
            throw e;
        }
    }

    @PostMapping("/orders/{orderId}/cancel")
    public ResponseEntity<ApiResponse<Orders>> cancelOrder(
            Authentication auth, @PathVariable String orderId) {
        User user = userRepository.findByPhoneNumber(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Orders order = orderService.cancelOrder(orderId, user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Order cancelled", order));
    }

    // ===== BOX ACCESS SIMULATION =====
    @PostMapping("/boxes/{boxId}/open")
    public ResponseEntity<ApiResponse<Map<String, Object>>> openBox(
            @PathVariable String boxId, @RequestBody Map<String, String> body) {
        Map<String, Object> result = boxAccessService.openBox(boxId, body.getOrDefault("otp", ""));
        return ResponseEntity.ok(ApiResponse.ok("Box open command sent", result));
    }

    @PostMapping("/boxes/{boxId}/close")
    public ResponseEntity<ApiResponse<Map<String, Object>>> closeBox(@PathVariable String boxId) {
        Map<String, Object> result = boxAccessService.closeBox(boxId);
        return ResponseEntity.ok(ApiResponse.ok("Box close command sent", result));
    }

    // ===== PROFILE =====
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<User>> getProfile(Authentication auth) {
        User user = userRepository.findByPhoneNumber(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(null); // never return password
        return ResponseEntity.ok(ApiResponse.ok(user));
    }
}
