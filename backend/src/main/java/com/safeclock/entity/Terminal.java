package com.safeclock.entity;

import com.safeclock.enums.TerminalStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(name = "terminals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Terminal {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(nullable = false)
    private String identifiableName;

    private String description;

    @Column(nullable = false)
    private String siteIdRef;

    private String physicalLocation;

    @Enumerated(EnumType.STRING)
    private TerminalStatus status;

    @Transient
    private Double latitude;

    @Transient
    private Double longitude;
}
