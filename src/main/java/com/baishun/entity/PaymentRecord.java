package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "payment_record")
public class PaymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 方向: RECEIVABLE-应收回款, PAYABLE-应付付款 */
    private String direction;

    /** 关联的应收/应付ID */
    private Long relatedId;

    private Long partyId;

    private String partyName;

    private BigDecimal amount;

    private String payMethod;

    private LocalDate payDate;

    private String remark;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
