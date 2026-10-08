package com.baishun.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaymentDTO {

    /** 方向: RECEIVABLE-应收回款, PAYABLE-应付付款 */
    private String direction;

    /** 关联的应收/应付ID */
    private Long relatedId;

    private BigDecimal amount;

    private String payMethod;

    private LocalDate payDate;

    private String remark;
}
