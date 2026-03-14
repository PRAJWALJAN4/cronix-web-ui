package com.safeclock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.Date;

@Entity
@Table(name = "pricing")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pricing {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String config;

    private String name;

    private Date createdAt;

    private Date updatedAt;

    private String updatedBy;

    private String createdBy;
}
