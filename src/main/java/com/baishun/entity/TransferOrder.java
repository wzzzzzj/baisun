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
@Table(name = "transfer_order")
public class TransferOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderNo;

    private LocalDate orderDate;

    private Long supplierId;

    private String supplierName;

    /** 调货类型: NORMAL-正常调货, EXCHANGE-换货, MAKEUP-补差, TEMP_LOAN-临时借货 */
    private String transferType = "NORMAL";

    private BigDecimal totalAmount = BigDecimal.ZERO;

    /** 付款状态: PAID-已付, UNPAID-未付, PARTIAL-部分付款 */
    private String payStatus = "UNPAID";

    private String payMethod;

    private BigDecimal paidAmount = BigDecimal.ZERO;

    private BigDecimal unpaidAmount = BigDecimal.ZERO;

    /** 入库仓库 */
    private Long warehouseId;

    private String warehouseName;

    private String remark;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "transfer_order_id")
    @ToString.Exclude
    private List<TransferOrderItem> items = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
