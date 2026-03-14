package com.safeclock.entity;

import com.safeclock.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Orders {

    @Id
    @Column(updatable = false, nullable = false)
    private String id;

    private Date startTime;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String terminalId;

    @Column(nullable = false)
    private String boxId;

    private Date endTime;

    private Date orderDate;

    private String pricingId;

    private String terminalMetaDataId;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private Date updatedAt;

    private Date updatedDate;

    private String pickupWindow;

    private Date expiryTime;

    private String dropoffCode;
    
    private String pickupCode;

    private Integer durationHours;

    private Date expectedEndTime;

    private int maxAttempts;

    private double slotPrice;

    private Double penaltyAmount = 0.0;

    private Double totalAmount;

    private String otp;

    private Date dateCreated;

    private String phoneNumber;

    private String boxName;

    private String pin;
}
