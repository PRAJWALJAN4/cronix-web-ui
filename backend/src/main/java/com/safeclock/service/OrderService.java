package com.safeclock.service;

import com.safeclock.entity.Box;
import com.safeclock.entity.Orders;
import com.safeclock.enums.BoxStatus;
import com.safeclock.enums.OrderStatus;
import com.safeclock.repository.BoxRepository;
import com.safeclock.repository.OrdersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrdersRepository ordersRepository;
    private final BoxRepository boxRepository;
    private final NotificationService notificationService;

    public List<Orders> getUserOrders(String userId) {
        return ordersRepository.findByUserId(userId);
    }

    public List<Orders> getUserActiveOrders(String userId) {
        return ordersRepository.findByUserIdAndStatus(userId, OrderStatus.RESERVED);
    }

    public Orders getOrder(String orderId) {
        return ordersRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    @Transactional
    public Orders processDropoff(String orderId, String code) {
        Orders order = getOrder(orderId);
        if (order.getStatus() != OrderStatus.RESERVED) {
            throw new RuntimeException("Order is not in reserved state");
        }
        if (!order.getDropoffCode().equals(code)) {
            throw new RuntimeException("Invalid drop-off code");
        }
        
        // Start the timer now
        Date now = new Date();
        order.setStartTime(now);
        order.setExpectedEndTime(new Date(now.getTime() + (long) order.getDurationHours() * 60 * 60 * 1000));
        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setUpdatedAt(now);
        ordersRepository.save(order);

        // Update box status
        Box box = boxRepository.findById(order.getBoxId())
                .orElseThrow(() -> new RuntimeException("Box not found"));
        box.setBoxStatus(BoxStatus.OCCUPIED_CLOSED);
        box.setUpdatedDate(now);
        boxRepository.save(box);
        
        log.info("📦 [HARDWARE MOCK] Box door automatically locked after drop-off. Box: {}", box.getIdentifiableName());

        // Notify user about successful drop-off, don't send pickup code yet
        notificationService.sendPickupNotification(order.getPhoneNumber(), orderId,
                order.getBoxName(), "****", "your SafeCloak Terminal");
        return order;
    }

    @Transactional
    public Orders generateAndSendPickupOtp(String orderId, String userId) {
        Orders order = getOrder(orderId);
        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (order.getStatus() != OrderStatus.IN_PROGRESS && order.getStatus() != OrderStatus.PAYMENT_PENDING) {
            throw new RuntimeException("Order is not ready for pickup");
        }
        
        // Generate a new 6-digit OTP for pickup and replace whatever was there
        String newOtp = String.format("%06d", new java.util.Random().nextInt(1000000));
        order.setPickupCode(newOtp);
        ordersRepository.save(order);
        
        notificationService.sendBoxAccessCode(order.getPhoneNumber(), newOtp, order.getBoxName());
        log.info("Requested Pickup OTP: {} for Order {}", newOtp, orderId);
        return order;
    }

    @Transactional
    public Orders processPickup(String orderId, String userId, String code, boolean paymentDone) {
        Orders order = getOrder(orderId);
        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (order.getStatus() != OrderStatus.IN_PROGRESS && order.getStatus() != OrderStatus.PAYMENT_PENDING) {
            throw new RuntimeException("Order is not ready for pickup");
        }
        // Pickup code validation removed per user request: user can auto-open without code.

        Date now = new Date();
        double currentPenalty = 0.0;
        
        // Calculate penalty if expectedEndTime is passed
        if (order.getExpectedEndTime() != null && now.after(order.getExpectedEndTime())) {
            long diffMilli = now.getTime() - order.getExpectedEndTime().getTime();
            long diffHours = (diffMilli / (60 * 60 * 1000)) + 1; // Round up to next hour
            currentPenalty = diffHours * 20.0;
        }

        double totalDue = order.getSlotPrice() + currentPenalty;

        if (totalDue > 0 && !paymentDone) {
            // Throw exception right away, the frontend handles it
            throw new RuntimeException("PAYMENT_REQUIRED:" + totalDue);
        }

        order.setPenaltyAmount(currentPenalty);
        order.setTotalAmount(totalDue);

        order.setStatus(OrderStatus.COMPLETED);
        order.setEndTime(now);
        order.setUpdatedAt(now);
        ordersRepository.save(order);

        // Release box
        Box box = boxRepository.findById(order.getBoxId())
                .orElseThrow(() -> new RuntimeException("Box not found"));
        box.setBoxStatus(BoxStatus.EMPTY_CLOSED);
        box.setUpdatedDate(now);
        boxRepository.save(box);

        log.info("✅ Pickup completed - Order: {}, Box: {}", orderId, box.getIdentifiableName());
        return order;
    }

    @Transactional
    public Orders cancelOrder(String orderId, String userId) {
        Orders order = getOrder(orderId);
        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed order");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(new Date());
        ordersRepository.save(order);

        Box box = boxRepository.findById(order.getBoxId())
                .orElseThrow(() -> new RuntimeException("Box not found"));
        box.setBoxStatus(BoxStatus.EMPTY_CLOSED);
        box.setUpdatedDate(new Date());
        boxRepository.save(box);

        return order;
    }

    public List<Orders> getAllOrders() {
        return ordersRepository.findAll();
    }

    @Transactional
    public Orders adminUpdateStatus(String orderId, OrderStatus status) {
        Orders order = getOrder(orderId);
        order.setStatus(status);
        order.setUpdatedAt(new Date());
        return ordersRepository.save(order);
    }
}
