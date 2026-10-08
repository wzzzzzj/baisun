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
@Table(name = "purchase_order")
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderNo;

    private LocalDate orderDate;

    private Long supplierId;

    private String supplierName;

    private String contactPerson;

    private String phone;

    /** 商品总金额 */
    private BigDecimal totalAmount = BigDecimal.ZERO;

    /** 运费 */
    private BigDecimal freight = BigDecimal.ZERO;

    /** 打包费 */
    private BigDecimal packingFee = BigDecimal.ZERO;

    /** 杂费 */
    private BigDecimal miscFee = BigDecimal.ZERO;

    /** 总计(商品金额+各项费用) */
    private BigDecimal grandTotal = BigDecimal.ZERO;

    /** 付款状态: PAID-已付, UNPAID-未付, PARTIAL-部分付款 */
    private String payStatus = "UNPAID";

    /** 付款方式: WECHAT, ALIPAY, BANK, CASH, MONTHLY */
    private String payMethod;

    private BigDecimal paidAmount = BigDecimal.ZERO;

    private BigDecimal unpaidAmount = BigDecimal.ZERO;

    /** 入库仓库 */
    private Long warehouseId;

    private String warehouseName;

    private String remark;

    /** 照片URL，逗号分隔 */
    private String photoUrls;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "purchase_order_id")
    @ToString.Exclude
    private List<PurchaseOrderItem> items = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
