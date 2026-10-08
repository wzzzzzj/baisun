package com.baishun.service;

import com.baishun.dto.PaymentDTO;
import com.baishun.entity.*;
import com.baishun.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class AccountService {

    @Autowired
    private AccountReceivableRepository receivableRepository;

    @Autowired
    private AccountPayableRepository payableRepository;

    @Autowired
    private PaymentRecordRepository paymentRecordRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private TransferOrderRepository transferOrderRepository;

    public List<AccountReceivable> findReceivables(Long customerId, String status) {
        if (customerId != null && status != null && !status.isBlank()) {
            return receivableRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(customerId, status);
        }
        if (customerId != null) {
            return receivableRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        }
        if (status != null && !status.isBlank()) {
            return receivableRepository.findByStatusOrderByCreatedAtDesc(status);
        }
        return receivableRepository.findAll();
    }

    public List<AccountPayable> findPayables(Long supplierId, String status) {
        if (supplierId != null && status != null && !status.isBlank()) {
            return payableRepository.findBySupplierIdAndStatusOrderByCreatedAtDesc(supplierId, status);
        }
        if (supplierId != null) {
            return payableRepository.findBySupplierIdOrderByCreatedAtDesc(supplierId);
        }
        if (status != null && !status.isBlank()) {
            return payableRepository.findByStatusOrderByCreatedAtDesc(status);
        }
        return payableRepository.findAll();
    }

    public void recordPayment(PaymentDTO dto) {
        if ("RECEIVABLE".equals(dto.getDirection())) {
            AccountReceivable ar = receivableRepository.findById(dto.getRelatedId())
                    .orElseThrow(() -> new IllegalArgumentException("应收账款不存在: " + dto.getRelatedId()));

            BigDecimal newPaid = ar.getPaidAmount().add(dto.getAmount());
            BigDecimal newUnpaid = ar.getUnpaidAmount().subtract(dto.getAmount());
            if (newUnpaid.compareTo(BigDecimal.ZERO) < 0) newUnpaid = BigDecimal.ZERO;
            final BigDecimal paidAmount = newPaid;
            final BigDecimal unpaidAmount = newUnpaid;

            ar.setPaidAmount(paidAmount);
            ar.setUnpaidAmount(unpaidAmount);
            ar.setStatus(unpaidAmount.compareTo(BigDecimal.ZERO) == 0 ? "SETTLED" : "PARTIAL");
            receivableRepository.save(ar);

            if (ar.getOrderId() != null) {
                salesOrderRepository.findById(ar.getOrderId()).ifPresent(order -> {
                    order.setPaidAmount(paidAmount);
                    order.setUnpaidAmount(unpaidAmount);
                    order.setPayStatus(unpaidAmount.compareTo(BigDecimal.ZERO) == 0 ? "SETTLED" : "PARTIAL");
                    salesOrderRepository.save(order);
                });
            }

            PaymentRecord record = new PaymentRecord();
            record.setDirection("RECEIVABLE");
            record.setRelatedId(ar.getId());
            record.setPartyId(ar.getCustomerId());
            record.setPartyName(ar.getCustomerName());
            record.setAmount(dto.getAmount());
            record.setPayMethod(dto.getPayMethod());
            record.setPayDate(dto.getPayDate());
            record.setRemark(dto.getRemark());
            paymentRecordRepository.save(record);

        } else if ("PAYABLE".equals(dto.getDirection())) {
            AccountPayable ap = payableRepository.findById(dto.getRelatedId())
                    .orElseThrow(() -> new IllegalArgumentException("应付账款不存在: " + dto.getRelatedId()));

            BigDecimal newPaid = ap.getPaidAmount().add(dto.getAmount());
            BigDecimal newUnpaid = ap.getUnpaidAmount().subtract(dto.getAmount());
            if (newUnpaid.compareTo(BigDecimal.ZERO) < 0) newUnpaid = BigDecimal.ZERO;
            final BigDecimal paidAmount = newPaid;
            final BigDecimal unpaidAmount = newUnpaid;

            ap.setPaidAmount(paidAmount);
            ap.setUnpaidAmount(unpaidAmount);
            ap.setStatus(unpaidAmount.compareTo(BigDecimal.ZERO) == 0 ? "SETTLED" : "PARTIAL");
            payableRepository.save(ap);

            if (ap.getOrderId() != null) {
                if ("PURCHASE".equals(ap.getOrderType())) {
                    purchaseOrderRepository.findById(ap.getOrderId()).ifPresent(order -> {
                        order.setPaidAmount(paidAmount);
                        order.setUnpaidAmount(unpaidAmount);
                        order.setPayStatus(unpaidAmount.compareTo(BigDecimal.ZERO) == 0 ? "PAID" : "PARTIAL");
                        purchaseOrderRepository.save(order);
                    });
                } else if ("TRANSFER".equals(ap.getOrderType())) {
                    transferOrderRepository.findById(ap.getOrderId()).ifPresent(order -> {
                        order.setPaidAmount(paidAmount);
                        order.setUnpaidAmount(unpaidAmount);
                        order.setPayStatus(unpaidAmount.compareTo(BigDecimal.ZERO) == 0 ? "PAID" : "PARTIAL");
                        transferOrderRepository.save(order);
                    });
                }
            }

            PaymentRecord record = new PaymentRecord();
            record.setDirection("PAYABLE");
            record.setRelatedId(ap.getId());
            record.setPartyId(ap.getSupplierId());
            record.setPartyName(ap.getSupplierName());
            record.setAmount(dto.getAmount());
            record.setPayMethod(dto.getPayMethod());
            record.setPayDate(dto.getPayDate());
            record.setRemark(dto.getRemark());
            paymentRecordRepository.save(record);
        }
    }

    public List<PaymentRecord> getPaymentHistory(Long relatedId) {
        return paymentRecordRepository.findByRelatedIdOrderByCreatedAtDesc(relatedId);
    }
}
