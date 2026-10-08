package com.baishun.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class WarehouseAllocation {
    private Long warehouseId;
    private String warehouseName;
    private BigDecimal quantity;
}
