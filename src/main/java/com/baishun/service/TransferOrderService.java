package com.baishun.service;

import com.baishun.common.AllocationUtils;
import com.baishun.common.OrderNoGenerator;
import com.baishun.dto.WarehouseAllocation;
import com.baishun.entity.*;
import com.baishun.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class TransferOrderService {

    @Autowired
    private TransferOrderRepository transferOrderRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private AccountPayableRepository accountPayableRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private com.baishun.repository.WarehouseRepository warehouseRepository;

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    public List<TransferOrder> search(LocalDate startDate, LocalDate endDate, Long supplierId, String payStatus) {
        if (startDate != null && endDate != null) {
            return transferOrderRepository.findByOrderDateBetweenOrderByOrderDateDescIdDesc(startDate, endDate);
        }
        if (supplierId != null) {
            return transferOrderRepository.findBySupplierIdOrderByOrderDateDescIdDesc(supplierId);
        }
        if (payStatus != null && !payStatus.isBlank()) {
            return transferOrderRepository.findByPayStatusOrderByOrderDateDescIdDesc(payStatus);
        }
        return transferOrderRepository.findAll();
    }

    public TransferOrder findById(Long id) {
        return transferOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("调货单不存在: " + id));
    }

    public TransferOrder create(TransferOrder order) {
        order.setOrderNo(OrderNoGenerator.generateTransferNo());
        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDate.now());
        }
        if (order.getTransferType() == null) {
            order.setTransferType("NORMAL");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (TransferOrderItem item : order.getItems()) {
            if (item.getTotalAmount() == null && item.getUnitPrice() != null && item.getQuantity() != null) {
                item.setTotalAmount(item.getUnitPrice().multiply(item.getQuantity()));
            }
            if (item.getTotalAmount() != null) {
                totalAmount = totalAmount.add(item.getTotalAmount());
            }
        }
        order.setTotalAmount(totalAmount);

        if (order.getPaidAmount() == null) order.setPaidAmount(BigDecimal.ZERO);
        BigDecimal unpaid = totalAmount.subtract(order.getPaidAmount());
        if (unpaid.compareTo(BigDecimal.ZERO) < 0) unpaid = BigDecimal.ZERO;
        order.setUnpaidAmount(unpaid);

        if (unpaid.compareTo(BigDecimal.ZERO) == 0) {
            order.setPayStatus("PAID");
        } else if (order.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            order.setPayStatus("PARTIAL");
        } else {
            order.setPayStatus("UNPAID");
        }

        if (order.getSupplierId() != null) {
            supplierRepository.findById(order.getSupplierId()).ifPresent(s ->
                    order.setSupplierName(s.getName()));
        }

        if (order.getWarehouseId() != null) {
            warehouseRepository.findById(order.getWarehouseId()).ifPresent(w ->
                    order.setWarehouseName(w.getName()));
        }

        TransferOrder saved = transferOrderRepository.save(order);

        for (TransferOrderItem item : saved.getItems()) {
            if (item.getProductId() != null && item.getQuantity() != null) {
                List<WarehouseAllocation> allocations = AllocationUtils.parse(item.getAllocations());
                if (!allocations.isEmpty()) {
                    BigDecimal totalAllocated = allocations.stream()
                            .map(WarehouseAllocation::getQuantity)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    if (totalAllocated.compareTo(item.getQuantity()) != 0) {
                        throw new IllegalArgumentException("商品「" + item.getProductName() +
                            "」的仓库分配总量(" + totalAllocated + ")与调货数量(" + item.getQuantity() + ")不一致");
                    }
                    for (WarehouseAllocation alloc : allocations) {
                        inventoryService.stockIn(item.getProductId(), alloc.getQuantity(),
                                alloc.getWarehouseId(), saved.getOrderNo(), "TRANSFER_IN", "市场调货入库");
                    }
                } else if (saved.getWarehouseId() != null) {
                    inventoryService.stockIn(item.getProductId(), item.getQuantity(),
                            saved.getWarehouseId(), saved.getOrderNo(), "TRANSFER_IN", "市场调货入库");
                }
            }
            // 更新平均进货价
            if (item.getProductId() != null && item.getQuantity() != null && item.getUnitPrice() != null) {
                purchaseOrderService.updateAveragePurchasePrice(item.getProductId(), item.getQuantity(), item.getUnitPrice());
            }
        }

        if (unpaid.compareTo(BigDecimal.ZERO) > 0) {
            AccountPayable ap = new AccountPayable();
            ap.setSupplierId(saved.getSupplierId());
            ap.setSupplierName(saved.getSupplierName());
            ap.setOrderId(saved.getId());
            ap.setOrderNo(saved.getOrderNo());
            ap.setOrderType("TRANSFER");
            ap.setTotalAmount(totalAmount);
            ap.setPaidAmount(order.getPaidAmount());
            ap.setUnpaidAmount(unpaid);
            ap.setStatus(order.getPaidAmount().compareTo(BigDecimal.ZERO) > 0 ? "PARTIAL" : "UNPAID");
            accountPayableRepository.save(ap);
        }

        return saved;
    }

    public void delete(Long id) {
        TransferOrder order = findById(id);
        java.util.Set<Long> affectedProductIds = new java.util.HashSet<>();
        for (TransferOrderItem item : order.getItems()) {
            if (item.getProductId() != null && item.getQuantity() != null) {
                affectedProductIds.add(item.getProductId());
                List<WarehouseAllocation> allocations = AllocationUtils.parse(item.getAllocations());
                if (!allocations.isEmpty()) {
                    for (WarehouseAllocation alloc : allocations) {
                        inventoryService.stockOut(item.getProductId(), alloc.getQuantity(),
                                alloc.getWarehouseId(), order.getOrderNo(), "TRANSFER_IN", "删除调货单-库存回退");
                    }
                } else if (order.getWarehouseId() != null) {
                    inventoryService.stockOut(item.getProductId(), item.getQuantity(),
                            order.getWarehouseId(), order.getOrderNo(), "TRANSFER_IN", "删除调货单-库存回退");
                }
            }
        }
        accountPayableRepository.findBySupplierIdOrderByCreatedAtDesc(order.getSupplierId()).stream()
                .filter(ap -> order.getId().equals(ap.getOrderId()))
                .findFirst()
                .ifPresent(accountPayableRepository::delete);
        transferOrderRepository.delete(order);
        for (Long productId : affectedProductIds) {
            purchaseOrderService.recalculateAveragePurchasePrice(productId);
        }
    }
}
