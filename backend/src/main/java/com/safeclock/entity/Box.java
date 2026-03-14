package com.safeclock.entity;

import com.safeclock.enums.BoxStatus;
import com.safeclock.enums.BoxType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.Date;

@Entity
@Table(name = "boxes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Box {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(nullable = false)
    private String terminalId;

    private String terminalMetaDataId;

    private String controllerId;

    private int port;

    @Enumerated(EnumType.STRING)
    private BoxStatus boxStatus;

    @Column(nullable = false)
    private String identifiableName;

    @Enumerated(EnumType.STRING)
    private BoxType type;

    private int col;

    private int rw;

    private Date updatedDate;
}
