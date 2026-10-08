package com.baishun.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DashboardDTO {

    private BigDecimal todayPurchaseTotal = BigDecimal.ZERO;
    private BigDecimal todayPurchaseFreight = BigDecimal.ZERO;
    private BigDecimal todayPurchasePackingFee = BigDecimal.ZERO;
    private BigDecimal todayPurchaseMiscFee = BigDecimal.ZERO;
    private BigDecimal todayTransferTotal = BigDecimal.ZERO;
    private BigDecimal todaySalesTotal = BigDecimal.ZERO;
    private BigDecimal todaySalesFreight = BigDecimal.ZERO;
    private BigDecimal todaySalesMiscFee = BigDecimal.ZERO;
    private BigDecimal todayGrossProfit = BigDecimal.ZERO;
    private BigDecimal todayNewReceivable = BigDecimal.ZERO;
    private BigDecimal todayNewPayable = BigDecimal.ZERO;
    private BigDecimal todayReceivedPayment = BigDecimal.ZERO;
    private BigDecimal todayPaidPayment = BigDecimal.ZERO;

    private BigDecimal totalReceivable = BigDecimal.ZERO;
    private BigDecimal totalPayable = BigDecimal.ZERO;

    private Integer lowStockCount = 0;
    private Integer totalProducts = 0;
    private Integer totalCustomers = 0;
    private Integer totalSuppliers = 0;
}
