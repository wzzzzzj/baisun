package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String spec;

    private String model;

    /** 厚度，如"1.2mm" */
    private String thickness;

    /** 颜色 */
    private String color;

    /** \u5e73\u5747\u5355\u4f4d\u91cd\u91cf\uff08\u6bcf\u6839/\u6bcf\u4ef6\u7684\u91cd\u91cf\uff0c\u6839\u636e\u8fdb\u8d27\u6570\u636e\u8ba1\u7b97\uff09 */
    private BigDecimal unitWeight;

    /** 长度，如"6m" */
    private String length;

    private String unit;

    private String category;

    /** 默认进货价（参考价） */
    private BigDecimal defaultPurchasePrice;

    /** 平均进货价（移动平均） */
    private BigDecimal averagePurchasePrice;

    /** 默认销售价 */
    private BigDecimal defaultSalePrice;

    /** 最低库存预警 */
    private BigDecimal minStock = BigDecimal.ZERO;

    /** 当前库存数量 */
    private BigDecimal currentStock = BigDecimal.ZERO;

    /** 状态: NORMAL-正常, SLOW_MOVING-积压 */
    private String status = "NORMAL";

    private String remark;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
