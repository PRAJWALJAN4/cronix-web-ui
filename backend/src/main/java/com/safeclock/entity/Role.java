package com.safeclock.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @Column(nullable = false)
    private String id;

    @Column(unique = true, nullable = false)
    private String name; // ROLE_USER, ROLE_ADMIN
}
