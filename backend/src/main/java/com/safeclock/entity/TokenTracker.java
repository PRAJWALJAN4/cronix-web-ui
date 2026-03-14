package com.safeclock.entity;

import com.safeclock.enums.TokenChannel;
import com.safeclock.enums.TokenFlow;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.Date;

@Entity
@Table(name = "token_tracker")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenTracker {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String token;

    @Enumerated(EnumType.STRING)
    private TokenFlow flow;

    @Enumerated(EnumType.STRING)
    private TokenChannel channel;

    private Date expiryTime;

    private boolean verified;

    private int attempts;
}
