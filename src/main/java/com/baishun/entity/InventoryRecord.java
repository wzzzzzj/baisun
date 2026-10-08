package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_record")
public class InventoryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;

    private String productName;

    private String spec;

    /** 记录类型: PURCHASE_IN-进货入库, TRANSFER_IN-调货入库, SALES_OUT-发货出库, CHECK_GAIN-盘盈, CHECK_LOSS-盘亏 */
    private String recordType;

    /** 变动数量(正数入库, 负数出库) */
    private BigDecimal quantity;

    /** 变动后库存 */
    private BigDecimal balanceAfter;

    private String relatedOrderNo;

    private LocalDate recordDate;

    private String remark;

    private Long warehouseId;

    private String warehouseName;

    private String unit;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
