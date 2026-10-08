package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "return_order")
public class ReturnOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderNo;

    private LocalDate orderDate;

    /** 退货类型: SUPPLIER-退给供应商, CUSTOMER-客户退货 */
    private String returnType;

    /** 目标ID */
    private Long targetId;

    /** 目标名称 */
    private String targetName;

    private String contactPerson;

    private String phone;

    private BigDecimal totalAmount = BigDecimal.ZERO;

    private BigDecimal freight = BigDecimal.ZERO;

    private BigDecimal miscFee = BigDecimal.ZERO;

    private BigDecimal grandTotal = BigDecimal.ZERO;

    private String payStatus = "UNPAID";

    private String payMethod;

    private BigDecimal paidAmount = BigDecimal.ZERO;

    private BigDecimal unpaidAmount = BigDecimal.ZERO;

    private Long warehouseId;

    private String warehouseName;

    private String remark;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "return_order_id")
    @ToString.Exclude
    private List<ReturnOrderItem> items = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}