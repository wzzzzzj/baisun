package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "transfer_order_item")
public class TransferOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;

    private String productName;

    private String spec;

    private BigDecimal unitPrice;

    private String unit;

    private BigDecimal quantity;

    private BigDecimal totalAmount;

    /** 仓库分配JSON: [{"warehouseId":1,"warehouseName":"A仓库","quantity":50}] */
    @Column(length = 2000)
    private String allocations;
}
