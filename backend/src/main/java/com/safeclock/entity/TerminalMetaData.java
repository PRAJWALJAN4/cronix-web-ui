package com.safeclock.entity;

import com.safeclock.enums.TerminalLayoutType;
import com.safeclock.enums.TerminalStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "terminal_metadata")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TerminalMetaData {

    @Id
    @Column(updatable = false, nullable = false)
    private String id;

    private String osVersion;

    @Column(nullable = false)
    private String terminalId;

    private String controllerId;

    @Enumerated(EnumType.STRING)
    private TerminalLayoutType layoutType;

    private String gatewayIdRef;

    private Date updatedAt;

    private Date createdAt;

    private int maxPorts;

    private Double partialPickupCharge;

    @Enumerated(EnumType.STRING)
    private TerminalStatus status;

    private boolean enabled;

    private String pricingIdRef;

    private Boolean skipPayment = false;

    @Column(length = 4000)
    private String gridLayout;
}
