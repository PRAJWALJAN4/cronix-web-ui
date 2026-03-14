package com.safeclock.dto.request;

import lombok.Data;

@Data
public class AllocateBoxRequest {
    private String terminalId;
    private String boxId;
    private Integer durationHours;
}
