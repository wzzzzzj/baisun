package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "purchase_order_item")
public class PurchaseOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;

    private String productName;

    private String spec;

    private String model;

    private BigDecimal unitPrice;

    private String unit;

    private BigDecimal quantity;

    /** \u603b\u91cd\u91cf\uff08\u5fc5\u586b\uff09 */
    private BigDecimal weight;

    private BigDecimal totalAmount;

    /** 仓库分配JSON: [{"warehouseId":1,"warehouseName":"A仓库","quantity":50}] */
    @Column(length = 2000)
    private String allocations;
}
