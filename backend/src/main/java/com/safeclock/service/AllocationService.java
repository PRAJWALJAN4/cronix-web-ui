package com.safeclock.service;

import com.safeclock.entity.Box;
import com.safeclock.entity.Orders;
import com.safeclock.entity.Terminal;
import com.safeclock.entity.TerminalMetaData;
import com.safeclock.enums.BoxStatus;
import com.safeclock.enums.BoxType;
import com.safeclock.enums.OrderStatus;
import com.safeclock.enums.TerminalLayoutType;
import com.safeclock.repository.BoxRepository;
import com.safeclock.repository.OrdersRepository;
import com.safeclock.repository.TerminalMetaDataRepository;
import com.safeclock.repository.TerminalRepository;
import com.safeclock.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AllocationService {

    private final BoxRepository boxRepository;
    private final OrdersRepository ordersRepository;
    private final TerminalRepository terminalRepository;
    private final TerminalMetaDataRepository terminalMetaDataRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public Orders allocateBox(String userId, String terminalId, String boxId, Integer durationHours) {
        if (durationHours == null) durationHours = 3; // default to 3h
        
        // 1. Validate terminal
        Terminal terminal = terminalRepository.findById(terminalId)
                .orElseThrow(() -> new RuntimeException("Terminal not found"));

        // 2. Acquire pessimistic lock on box
        Box box = boxRepository.findByIdWithLock(boxId)
                .orElseThrow(() -> new RuntimeException("Box not found"));

        // 3. Validate box belongs to this terminal
        if (!box.getTerminalId().equals(terminalId)) {
            throw new RuntimeException("Box does not belong to this terminal");
        }

        // 4. Double-check box is still available (after lock acquired)
        if (box.getBoxStatus() != BoxStatus.EMPTY_CLOSED) {
            throw new RuntimeException("Box " + box.getIdentifiableName() + " is no longer available. Please select another.");
        }

        // 5. Check no active order exists for this box
        ordersRepository.findByBoxIdAndStatusIn(boxId,
                Arrays.asList(OrderStatus.RESERVED, OrderStatus.READY_FOR_PICKUP, OrderStatus.IN_PROGRESS))
                .ifPresent(o -> {
                    throw new RuntimeException("Box is already allocated");
                });

        // 6. Get user
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 7. Get metadata for pricing
        TerminalMetaData meta = terminalMetaDataRepository.findFirstByTerminalIdOrderByUpdatedAtDesc(terminalId).orElse(null);

        // 8. Generate order
        String orderId = "SC-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String dropoffCode = String.format("%04d", new Random().nextInt(10000));
        String pickupCode = String.format("%04d", new Random().nextInt(10000));
        String otp = String.format("%06d", new Random().nextInt(1000000));
        Date now = new Date();
        Date expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h before hitting dropoff
        Date expectedEnd = new Date(now.getTime() + (long) durationHours * 60 * 60 * 1000);

        double price = calculatePrice(box.getType(), meta, durationHours);

        Orders order = Orders.builder()
                .id(orderId)
                .userId(userId)
                .terminalId(terminalId)
                .boxId(boxId)
                .orderDate(now)
                .dateCreated(now)
                .startTime(now) // We assume start time is from reservation currently, or change later on dropoff
                .expiryTime(expiry)
                .expectedEndTime(expectedEnd)
                .durationHours(durationHours)
                .status(OrderStatus.RESERVED)
                .dropoffCode(dropoffCode)
                .pickupCode(pickupCode)
                .otp(otp)
                .boxName(box.getIdentifiableName())
                .phoneNumber(user.getPhoneNumber())
                .slotPrice(price)
                .totalAmount(price)
                .penaltyAmount(0.0)
                .maxAttempts(5)
                .pickupWindow(durationHours + " hours")
                .terminalMetaDataId(meta != null ? meta.getId() : null)
                .pricingId(meta != null ? meta.getPricingIdRef() : null)
                .build();

        ordersRepository.save(order);

        // 9. Update box status
        box.setBoxStatus(BoxStatus.BOOKED);
        box.setUpdatedDate(now);
        boxRepository.save(box);

        // 10. Send notifications
        String terminalAddress = terminal.getPhysicalLocation() != null
                ? terminal.getPhysicalLocation() : terminal.getIdentifiableName();
        notificationService.sendPickupNotification(user.getPhoneNumber(), orderId,
                box.getIdentifiableName(), dropoffCode, terminalAddress);

        log.info("✅ Box {} allocated to user {} - Order {}", box.getIdentifiableName(), userId, orderId);
        return order;
    }

    private double calculatePrice(BoxType type, TerminalMetaData meta, int durationHours) {
        // Default prices if no pricing config
        double basePrice = switch (type) {
            case SMALL -> 30.0;
            case MEDIUM -> 50.0;
            case LARGE -> 80.0;
            case EXTRA_LARGE -> 120.0;
        };
        
        // Duration multiplier:
        // 3h = 1x, 6h = 1.8x, 9h = 2.5x, 24h = 5x
        double multiplier = 1.0;
        if (durationHours == 6) multiplier = 1.8;
        else if (durationHours == 9) multiplier = 2.5;
        else if (durationHours == 24) multiplier = 5.0;
        else if (durationHours > 3) multiplier = 1.0 + ((durationHours - 3) * 0.25); // fallback formula
        
        return Math.round(basePrice * multiplier * 100.0) / 100.0;
    }
}
