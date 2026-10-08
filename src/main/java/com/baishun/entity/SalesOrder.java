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
@Table(name = "sales_order")
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderNo;

    private LocalDate orderDate;

    private Long customerId;

    private String customerName;

    private String address;

    private String phone;

    /** 商品总金额 */
    private BigDecimal totalAmount = BigDecimal.ZERO;

    /** 优惠/抹零/折扣金额 */
    private BigDecimal discount = BigDecimal.ZERO;

    /** 实收金额 = totalAmount - discount */
    private BigDecimal finalAmount = BigDecimal.ZERO;

    /** 收款状态: SETTLED-已结, ON_CREDIT-赊账, PARTIAL-部分结款 */
    private String payStatus = "SETTLED";

    private String payMethod;

    private BigDecimal paidAmount = BigDecimal.ZERO;

    private BigDecimal unpaidAmount = BigDecimal.ZERO;

    /** 配送方式: SELF_PICKUP-自提, DELIVERY-送货, LOGISTICS-物流 */
    private String deliveryMethod = "DELIVERY";

    /** 出库仓库 */
    private Long warehouseId;

    private String warehouseName;

    /** 运费 */
    private BigDecimal freight = BigDecimal.ZERO;

    /** 杂费 */
    private BigDecimal miscFee = BigDecimal.ZERO;

    /** 总计(商品金额-优惠+运费+杂费) */
    private BigDecimal grandTotal = BigDecimal.ZERO;

    private String remark;

    private String photoUrls;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_order_id")
    @ToString.Exclude
    private List<SalesOrderItem> items = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
