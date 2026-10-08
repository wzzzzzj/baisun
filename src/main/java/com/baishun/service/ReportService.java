package com.baishun.service;

import com.baishun.dto.DashboardDTO;
import com.baishun.entity.*;
import com.baishun.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ReportService {

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private TransferOrderRepository transferOrderRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private AccountReceivableRepository receivableRepository;

    @Autowired
    private AccountPayableRepository payableRepository;

    @Autowired
    private PaymentRecordRepository paymentRecordRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    public DashboardDTO getDashboard() {
        LocalDate today = LocalDate.now();
        return getDailyReport(today);
    }

    public DashboardDTO getDailyReport(LocalDate date) {
        DashboardDTO dto = new DashboardDTO();

        List<PurchaseOrder> purchases = purchaseOrderRepository
                .findByOrderDateBetweenOrderByOrderDateDescIdDesc(date, date);
        BigDecimal purchaseTotal = purchases.stream()
                .map(po -> po.getGrandTotal() != null ? po.getGrandTotal() : po.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodayPurchaseTotal(purchaseTotal);
        BigDecimal purchaseFreight = purchases.stream()
                .map(po -> po.getFreight() != null ? po.getFreight() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodayPurchaseFreight(purchaseFreight);
        BigDecimal purchasePackingFee = purchases.stream()
                .map(po -> po.getPackingFee() != null ? po.getPackingFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodayPurchasePackingFee(purchasePackingFee);
        BigDecimal purchaseMiscFee = purchases.stream()
                .map(po -> po.getMiscFee() != null ? po.getMiscFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodayPurchaseMiscFee(purchaseMiscFee);

        List<TransferOrder> transfers = transferOrderRepository
                .findByOrderDateBetweenOrderByOrderDateDescIdDesc(date, date);
        BigDecimal transferTotal = transfers.stream()
                .map(TransferOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodayTransferTotal(transferTotal);

        List<SalesOrder> sales = salesOrderRepository
                .findByOrderDateBetweenOrderByOrderDateDescIdDesc(date, date);
        BigDecimal salesTotal = sales.stream()
                .map(so -> so.getGrandTotal() != null ? so.getGrandTotal() : so.getFinalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodaySalesTotal(salesTotal);
        BigDecimal salesFreight = sales.stream()
                .map(so -> so.getFreight() != null ? so.getFreight() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodaySalesFreight(salesFreight);
        BigDecimal salesMiscFee = sales.stream()
                .map(so -> so.getMiscFee() != null ? so.getMiscFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodaySalesMiscFee(salesMiscFee);

        BigDecimal productSalesTotal = sales.stream()
                .map(so -> so.getFinalAmount() != null ? so.getFinalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal estimatedCost = BigDecimal.ZERO;
        Map<Long, Product> productMap = new HashMap<>();
        for (SalesOrder so : sales) {
            for (SalesOrderItem item : so.getItems()) {
                if (item.getProductId() != null && item.getQuantity() != null) {
                    Product product = productMap.computeIfAbsent(item.getProductId(),
                            id -> productRepository.findById(id).orElse(null));
                    if (product != null && product.getAveragePurchasePrice() != null) {
                        BigDecimal unitWeight = product.getUnitWeight() != null ? product.getUnitWeight() : BigDecimal.ONE;
                        estimatedCost = estimatedCost.add(
                                unitWeight.multiply(product.getAveragePurchasePrice()).multiply(item.getQuantity()));
                    }
                }
            }
        }
        BigDecimal totalFreight = sales.stream()
                .map(so -> so.getFreight() != null ? so.getFreight() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalMiscFee = sales.stream()
                .map(so -> so.getMiscFee() != null ? so.getMiscFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodayGrossProfit(productSalesTotal.subtract(estimatedCost).subtract(totalFreight).subtract(totalMiscFee));

        BigDecimal newReceivable = BigDecimal.ZERO;
        for (SalesOrder so : sales) {
            if (so.getUnpaidAmount() != null && so.getUnpaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                newReceivable = newReceivable.add(so.getUnpaidAmount());
            }
        }
        dto.setTodayNewReceivable(newReceivable);

        BigDecimal newPayable = BigDecimal.ZERO;
        for (PurchaseOrder po : purchases) {
            if (po.getUnpaidAmount() != null && po.getUnpaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                newPayable = newPayable.add(po.getUnpaidAmount());
            }
        }
        for (TransferOrder to : transfers) {
            if (to.getUnpaidAmount() != null && to.getUnpaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                newPayable = newPayable.add(to.getUnpaidAmount());
            }
        }
        dto.setTodayNewPayable(newPayable);

        List<PaymentRecord> allPayments = paymentRecordRepository.findAll();
        BigDecimal receivedToday = allPayments.stream()
                .filter(p -> "RECEIVABLE".equals(p.getDirection()) && date.equals(p.getPayDate()))
                .map(PaymentRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodayReceivedPayment(receivedToday);

        BigDecimal paidToday = allPayments.stream()
                .filter(p -> "PAYABLE".equals(p.getDirection()) && date.equals(p.getPayDate()))
                .map(PaymentRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTodayPaidPayment(paidToday);

        BigDecimal totalReceivable = receivableRepository.findByStatusOrderByCreatedAtDesc("UNPAID").stream()
                .map(AccountReceivable::getUnpaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(receivableRepository.findByStatusOrderByCreatedAtDesc("PARTIAL").stream()
                        .map(AccountReceivable::getUnpaidAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        dto.setTotalReceivable(totalReceivable);

        BigDecimal totalPayable = payableRepository.findByStatusOrderByCreatedAtDesc("UNPAID").stream()
                .map(AccountPayable::getUnpaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(payableRepository.findByStatusOrderByCreatedAtDesc("PARTIAL").stream()
                        .map(AccountPayable::getUnpaidAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        dto.setTotalPayable(totalPayable);

        dto.setLowStockCount(productRepository.findLowStockProducts().size());
        dto.setTotalProducts((int) productRepository.count());
        dto.setTotalCustomers((int) customerRepository.count());
        dto.setTotalSuppliers((int) supplierRepository.count());

        return dto;
    }

    public Map<String, Object> getMonthlyReport(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);

        Map<String, Object> report = new HashMap<>();

        List<PurchaseOrder> purchases = purchaseOrderRepository
                .findByOrderDateBetweenOrderByOrderDateDescIdDesc(start, end);
        BigDecimal purchaseCost = purchases.stream()
                .map(PurchaseOrder::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.put("totalPurchaseCost", purchaseCost);
        report.put("purchaseCount", purchases.size());

        List<TransferOrder> transfers = transferOrderRepository
                .findByOrderDateBetweenOrderByOrderDateDescIdDesc(start, end);
        BigDecimal transferCost = transfers.stream()
                .map(TransferOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.put("totalTransferCost", transferCost);
        report.put("transferCount", transfers.size());

        List<SalesOrder> sales = salesOrderRepository
                .findByOrderDateBetweenOrderByOrderDateDescIdDesc(start, end);
        BigDecimal salesTotal = sales.stream()
                .map(so -> so.getGrandTotal() != null ? so.getGrandTotal() : so.getFinalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.put("totalSales", salesTotal);
        report.put("salesCount", sales.size());

        BigDecimal productSalesTotal = sales.stream()
                .map(so -> so.getFinalAmount() != null ? so.getFinalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal estimatedCost = BigDecimal.ZERO;
        Map<Long, Product> productMap = new HashMap<>();
        for (SalesOrder so : sales) {
            for (SalesOrderItem item : so.getItems()) {
                if (item.getProductId() != null && item.getQuantity() != null) {
                    Product product = productMap.computeIfAbsent(item.getProductId(),
                            id -> productRepository.findById(id).orElse(null));
                    if (product != null && product.getAveragePurchasePrice() != null) {
                        BigDecimal unitWeight = product.getUnitWeight() != null ? product.getUnitWeight() : BigDecimal.ONE;
                        estimatedCost = estimatedCost.add(
                                unitWeight.multiply(product.getAveragePurchasePrice()).multiply(item.getQuantity()));
                    }
                }
            }
        }
        BigDecimal totalFreight = sales.stream()
                .map(so -> so.getFreight() != null ? so.getFreight() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalMiscFee = sales.stream()
                .map(so -> so.getMiscFee() != null ? so.getMiscFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal grossProfit = productSalesTotal.subtract(estimatedCost).subtract(totalFreight).subtract(totalMiscFee);
        report.put("estimatedCost", estimatedCost);
        report.put("grossProfit", grossProfit);

        BigDecimal totalReceivable = receivableRepository.findByStatusOrderByCreatedAtDesc("UNPAID").stream()
                .map(AccountReceivable::getUnpaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(receivableRepository.findByStatusOrderByCreatedAtDesc("PARTIAL").stream()
                        .map(AccountReceivable::getUnpaidAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        report.put("totalReceivable", totalReceivable);

        BigDecimal totalPayable = payableRepository.findByStatusOrderByCreatedAtDesc("UNPAID").stream()
                .map(AccountPayable::getUnpaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(payableRepository.findByStatusOrderByCreatedAtDesc("PARTIAL").stream()
                        .map(AccountPayable::getUnpaidAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        report.put("totalPayable", totalPayable);

        List<PaymentRecord> allPayments = paymentRecordRepository.findAll();
        BigDecimal totalReceived = allPayments.stream()
                .filter(p -> "RECEIVABLE".equals(p.getDirection()) &&
                        p.getPayDate() != null &&
                        !p.getPayDate().isBefore(start) &&
                        !p.getPayDate().isAfter(end))
                .map(PaymentRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.put("totalReceived", totalReceived);

        BigDecimal totalPaid = allPayments.stream()
                .filter(p -> "PAYABLE".equals(p.getDirection()) &&
                        p.getPayDate() != null &&
                        !p.getPayDate().isBefore(start) &&
                        !p.getPayDate().isAfter(end))
                .map(PaymentRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.put("totalPaid", totalPaid);

        report.put("netProfit", grossProfit);

        return report;
    }
}