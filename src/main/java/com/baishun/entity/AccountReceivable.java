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
@Table(name = "account_receivable")
public class AccountReceivable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long customerId;

    private String customerName;

    private Long orderId;

    private String orderNo;

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
