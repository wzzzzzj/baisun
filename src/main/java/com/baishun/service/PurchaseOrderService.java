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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PurchaseOrderService {

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private AccountPayableRepository accountPayableRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private com.baishun.repository.WarehouseRepository warehouseRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TransferOrderRepository transferOrderRepository;

    public List<PurchaseOrder> search(LocalDate startDate, LocalDate endDate, Long supplierId, String payStatus) {
        List<PurchaseOrder> orders = purchaseOrderRepository.findAll();
        if (startDate != null) {
            orders = orders.stream()
                .filter(o -> o.getOrderDate() != null && !o.getOrderDate().isBefore(startDate))
                .collect(Collectors.toList());
        }
        if (endDate != null) {
            orders = orders.stream()
                .filter(o -> o.getOrderDate() != null && !o.getOrderDate().isAfter(endDate))
                .collect(Collectors.toList());
        }
        if (supplierId != null) {
            orders = orders.stream()
                .filter(o -> supplierId.equals(o.getSupplierId()))
                .collect(Collectors.toList());
        }
        if (payStatus != null && !payStatus.isBlank()) {
            orders = orders.stream()
                .filter(o -> payStatus.equals(o.getPayStatus()))
                .collect(Collectors.toList());
        }
        orders.sort((a, b) -> {
            if (b.getOrderDate() == null && a.getOrderDate() == null) return 0;
            if (b.getOrderDate() == null) return -1;
            if (a.getOrderDate() == null) return 1;
            return b.getOrderDate().compareTo(a.getOrderDate());
        });
        return orders;
    }

    public PurchaseOrder findById(Long id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("进货单不存在: " + id));
    }

    public PurchaseOrder create(PurchaseOrder order) {
        order.setOrderNo(OrderNoGenerator.generatePurchaseNo());
        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDate.now());
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (PurchaseOrderItem item : order.getItems()) {
            if (item.getTotalAmount() == null && item.getUnitPrice() != null) {
                if (item.getWeight() != null) {
                    item.setTotalAmount(item.getUnitPrice().multiply(item.getWeight()));
                } else if (item.getQuantity() != null) {
                    item.setTotalAmount(item.getUnitPrice().multiply(item.getQuantity()));
                }
            }
            if (item.getTotalAmount() != null) {
                totalAmount = totalAmount.add(item.getTotalAmount());
            }
        }
        order.setTotalAmount(totalAmount);

        BigDecimal grandTotal = totalAmount;
        if (order.getFreight() != null) grandTotal = grandTotal.add(order.getFreight());
        if (order.getPackingFee() != null) grandTotal = grandTotal.add(order.getPackingFee());
        if (order.getMiscFee() != null) grandTotal = grandTotal.add(order.getMiscFee());
        order.setGrandTotal(grandTotal);

        if (order.getPaidAmount() == null) order.setPaidAmount(BigDecimal.ZERO);
        BigDecimal unpaid = grandTotal.subtract(order.getPaidAmount());
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

        PurchaseOrder saved = purchaseOrderRepository.save(order);

        for (PurchaseOrderItem item : saved.getItems()) {
            if (item.getProductId() != null && item.getQuantity() != null) {
                List<WarehouseAllocation> allocations = AllocationUtils.parse(item.getAllocations());
                if (!allocations.isEmpty()) {
                    BigDecimal totalAllocated = allocations.stream()
                            .map(WarehouseAllocation::getQuantity)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    if (totalAllocated.compareTo(item.getQuantity()) != 0) {
                        throw new IllegalArgumentException("商品「" + item.getProductName() +
                            "」的仓库分配总量(" + totalAllocated + ")与进货数量(" + item.getQuantity() + ")不一致");
                    }
                    for (WarehouseAllocation alloc : allocations) {
                        inventoryService.stockIn(item.getProductId(), alloc.getQuantity(),
                                alloc.getWarehouseId(), saved.getOrderNo(), "PURCHASE_IN", "厂家进货入库");
                    }
                } else {
                    inventoryService.stockIn(item.getProductId(), item.getQuantity(),
                            saved.getWarehouseId(), saved.getOrderNo(), "PURCHASE_IN", "厂家进货入库");
                }
                if (item.getWeight() != null && item.getQuantity() != null
                        && item.getQuantity().compareTo(BigDecimal.ZERO) != 0) {
                    updateUnitWeight(item.getProductId(), item.getWeight(), item.getQuantity());
                }
                if (item.getUnitPrice() != null) {
                    updateAveragePurchasePrice(item.getProductId(), item.getQuantity(), item.getUnitPrice());
                }
            }
        }

        if (unpaid.compareTo(BigDecimal.ZERO) > 0) {
            AccountPayable ap = new AccountPayable();
            ap.setSupplierId(saved.getSupplierId());
            ap.setSupplierName(saved.getSupplierName());
            ap.setOrderId(saved.getId());
            ap.setOrderNo(saved.getOrderNo());
            ap.setOrderType("PURCHASE");
            ap.setTotalAmount(grandTotal);
            ap.setPaidAmount(order.getPaidAmount());
            ap.setUnpaidAmount(unpaid);
            ap.setStatus(order.getPaidAmount().compareTo(BigDecimal.ZERO) > 0 ? "PARTIAL" : "UNPAID");
            accountPayableRepository.save(ap);
        }

        return saved;
    }

    public void delete(Long id) {
        PurchaseOrder order = findById(id);
        java.util.Set<Long> affectedProductIds = new java.util.HashSet<>();
        for (PurchaseOrderItem item : order.getItems()) {
            if (item.getProductId() != null && item.getQuantity() != null) {
                affectedProductIds.add(item.getProductId());
                List<WarehouseAllocation> allocations = AllocationUtils.parse(item.getAllocations());
                if (!allocations.isEmpty()) {
                    for (WarehouseAllocation alloc : allocations) {
                        inventoryService.stockOut(item.getProductId(), alloc.getQuantity(),
                                alloc.getWarehouseId(), order.getOrderNo(), "PURCHASE_IN", "删除进货单-库存回退");
                    }
                } else {
                    inventoryService.stockOut(item.getProductId(), item.getQuantity(),
                            order.getWarehouseId(), order.getOrderNo(), "PURCHASE_IN", "删除进货单-库存回退");
                }
            }
        }
        accountPayableRepository.findBySupplierIdOrderByCreatedAtDesc(order.getSupplierId()).stream()
                .filter(ap -> order.getId().equals(ap.getOrderId()))
                .findFirst()
                .ifPresent(accountPayableRepository::delete);
        purchaseOrderRepository.delete(order);
        for (Long productId : affectedProductIds) {
            recalculateAveragePurchasePrice(productId);
        }
    }

    private void updateUnitWeight(Long productId, BigDecimal weight, BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) == 0) return;
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;
        BigDecimal unitWeight = weight.divide(quantity, 4, RoundingMode.HALF_UP);
        product.setUnitWeight(unitWeight);
        productRepository.save(product);
    }

    public void updateAveragePurchasePrice(Long productId, BigDecimal quantity, BigDecimal unitPrice) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;
        BigDecimal oldStock = product.getCurrentStock() == null ? BigDecimal.ZERO : product.getCurrentStock();
        BigDecimal beforeStock = oldStock.subtract(quantity);
        BigDecimal oldAvg = product.getAveragePurchasePrice();
        if (oldAvg == null || oldAvg.compareTo(BigDecimal.ZERO) == 0) {
            oldAvg = unitPrice != null ? unitPrice : BigDecimal.ZERO;
        }
        if (oldStock.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal totalCost = beforeStock.multiply(oldAvg).add(quantity.multiply(unitPrice));
            BigDecimal newAvg = totalCost.divide(oldStock, 4, RoundingMode.HALF_UP);
            product.setAveragePurchasePrice(newAvg);
        } else {
            product.setAveragePurchasePrice(unitPrice);
        }
        productRepository.save(product);
    }

    public void recalculateAveragePurchasePrice(Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalQty = BigDecimal.ZERO;
        for (PurchaseOrder po : purchaseOrderRepository.findAll()) {
            for (PurchaseOrderItem item : po.getItems()) {
                if (productId.equals(item.getProductId())
                        && item.getQuantity() != null
                        && item.getUnitPrice() != null) {
                    totalQty = totalQty.add(item.getQuantity());
                    totalCost = totalCost.add(item.getQuantity().multiply(item.getUnitPrice()));
                }
            }
        }
        for (TransferOrder to : transferOrderRepository.findAll()) {
            for (TransferOrderItem item : to.getItems()) {
                if (productId.equals(item.getProductId())
                        && item.getQuantity() != null
                        && item.getUnitPrice() != null) {
                    totalQty = totalQty.add(item.getQuantity());
                    totalCost = totalCost.add(item.getQuantity().multiply(item.getUnitPrice()));
                }
            }
        }
        if (totalQty.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal newAvg = totalCost.divide(totalQty, 4, RoundingMode.HALF_UP);
            product.setAveragePurchasePrice(newAvg);
        } else {
            product.setAveragePurchasePrice(null);
        }
        productRepository.save(product);
    }
}