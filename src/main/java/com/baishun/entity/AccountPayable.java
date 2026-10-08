package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "account_payable")
public class AccountPayable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long supplierId;

    private String supplierName;

    private Long orderId;

    private String orderNo;

    /** 单据类型: PURCHASE-进货, TRANSFER-调货 */
    private String orderType;

    private BigDecimal totalAmount = BigDecimal.ZERO;

    private BigDecimal paidAmount = BigDecimal.ZERO;

    private BigDecimal unpaidAmount = BigDecimal.ZERO;

    /** 状态: UNPAID-未付, PARTIAL-部分, SETTLED-已结 */
    private String status = "UNPAID";

    private LocalDate dueDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
