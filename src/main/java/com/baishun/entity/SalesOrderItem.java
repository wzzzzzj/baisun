package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "sales_order_item")
public class SalesOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;

    private String productName;

    private String spec;

    private BigDecimal unitPrice;

    private String unit;

    private BigDecimal quantity;

    /** \u603b\u91cd\u91cf\uff08\u53ef\u7a7a\uff0c\u586b\u4e86\u6309\u91cd\u91cf\u7b97\u4ef7\uff0c\u4e0d\u586b\u6309\u6570\u91cf\u7b97\u4ef7\uff09 */
    private BigDecimal weight;

    private BigDecimal totalAmount;

    /** 仓库分配JSON: [{"warehouseId":1,"warehouseName":"A仓库","quantity":50}] */
    @Column(length = 2000)
    private String allocations;
}
