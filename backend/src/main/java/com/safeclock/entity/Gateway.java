package com.safeclock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(name = "gateways")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gateway {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(updatable = false, nullable = false)
    private String id;

    private String macAddress;

    private String deviceId;

    private String status;

    private String sqsEndpoint;

    private String topic;
}
