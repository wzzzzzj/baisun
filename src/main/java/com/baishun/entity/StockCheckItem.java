package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "stock_check_item")
public class StockCheckItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;

    private String productName;

    private String spec;

    /** 账面库存 */
    private BigDecimal bookStock;

    /** 实际库存 */
    private BigDecimal actualStock;

    /** 差异 = actualStock - bookStock */
    private BigDecimal diff;

    /** 差异类型: GAIN-盘盈, LOSS-盘亏, NONE-一致 */
    private String diffType = "NONE";

    private String remark;
}
