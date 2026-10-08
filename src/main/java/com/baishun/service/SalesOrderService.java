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
public class SalesOrderService {

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private AccountReceivableRepository accountReceivableRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private com.baishun.repository.WarehouseRepository warehouseRepository;

    public List<SalesOrder> search(LocalDate startDate, LocalDate endDate, Long customerId, String payStatus) {
        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByOrderDateBetweenOrderByOrderDateDescIdDesc(startDate, endDate);
        }
        if (startDate != null) {
            return salesOrderRepository.findByOrderDateGreaterThanEqualOrderByOrderDateDescIdDesc(startDate);
        }
        if (customerId != null) {
            return salesOrderRepository.findByCustomerIdOrderByOrderDateDescIdDesc(customerId);
        }
        if (payStatus != null && !payStatus.isBlank()) {
            return salesOrderRepository.findByPayStatusOrderByOrderDateDescIdDesc(payStatus);
        }
        return salesOrderRepository.findAll();
    }

    public SalesOrder findById(Long id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("发货单不存在: " + id));
    }

    public SalesOrder create(SalesOrder order) {
        order.setOrderNo(OrderNoGenerator.generateSalesNo());
        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDate.now());
        }
        if (order.getDeliveryMethod() == null) {
            order.setDeliveryMethod("DELIVERY");
        }
        if (order.getDiscount() == null) {
            order.setDiscount(BigDecimal.ZERO);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (SalesOrderItem item : order.getItems()) {
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

        BigDecimal finalAmount = totalAmount.subtract(order.getDiscount());
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;
        order.setFinalAmount(finalAmount);

        if (order.getFreight() == null) order.setFreight(BigDecimal.ZERO);
        if (order.getMiscFee() == null) order.setMiscFee(BigDecimal.ZERO);
        BigDecimal grandTotal = finalAmount.add(order.getFreight()).add(order.getMiscFee());
        order.setGrandTotal(grandTotal);

        if (order.getPaidAmount() == null) order.setPaidAmount(BigDecimal.ZERO);
        BigDecimal unpaid = grandTotal.subtract(order.getPaidAmount());
        if (unpaid.compareTo(BigDecimal.ZERO) < 0) unpaid = BigDecimal.ZERO;
        order.setUnpaidAmount(unpaid);

        if (unpaid.compareTo(BigDecimal.ZERO) == 0) {
            order.setPayStatus("SETTLED");
        } else if (order.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            order.setPayStatus("PARTIAL");
        } else {
            order.setPayStatus("ON_CREDIT");
        }

        if (order.getCustomerId() != null) {
            customerRepository.findById(order.getCustomerId()).ifPresent(c -> {
                order.setCustomerName(c.getName());
                if (order.getPhone() == null) order.setPhone(c.getPhone());
                if (order.getAddress() == null) order.setAddress(c.getAddress());
            });
        }

        if (order.getWarehouseId() != null) {
            warehouseRepository.findById(order.getWarehouseId()).ifPresent(w ->
                    order.setWarehouseName(w.getName()));
        }

        SalesOrder saved = salesOrderRepository.save(order);

        for (SalesOrderItem item : saved.getItems()) {
            if (item.getProductId() != null && item.getQuantity() != null) {
                List<WarehouseAllocation> allocations = AllocationUtils.parse(item.getAllocations());
                if (!allocations.isEmpty()) {
                    BigDecimal totalAllocated = allocations.stream()
                            .map(WarehouseAllocation::getQuantity)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    if (totalAllocated.compareTo(item.getQuantity()) != 0) {
                        throw new IllegalArgumentException("商品「" + item.getProductName() +
                            "」的仓库分配总量(" + totalAllocated + ")与发货数量(" + item.getQuantity() + ")不一致");
                    }
                    for (WarehouseAllocation alloc : allocations) {
                        inventoryService.stockOut(item.getProductId(), alloc.getQuantity(),
                                alloc.getWarehouseId(), saved.getOrderNo(), "SALES_OUT", "客户发货出库");
                    }
                } else if (saved.getWarehouseId() != null) {
                    inventoryService.stockOut(item.getProductId(), item.getQuantity(),
                            saved.getWarehouseId(), saved.getOrderNo(), "SALES_OUT", "客户发货出库");
                }
            }
        }

        if (unpaid.compareTo(BigDecimal.ZERO) > 0) {
            AccountReceivable ar = new AccountReceivable();
            ar.setCustomerId(saved.getCustomerId());
            ar.setCustomerName(saved.getCustomerName());
            ar.setOrderId(saved.getId());
            ar.setOrderNo(saved.getOrderNo());
            ar.setTotalAmount(grandTotal);
            ar.setPaidAmount(order.getPaidAmount());
            ar.setUnpaidAmount(unpaid);
            ar.setStatus(order.getPaidAmount().compareTo(BigDecimal.ZERO) > 0 ? "PARTIAL" : "UNPAID");
            accountReceivableRepository.save(ar);
        }

        return saved;
    }

    public void delete(Long id) {
        SalesOrder order = findById(id);
        for (SalesOrderItem item : order.getItems()) {
            if (item.getProductId() != null && item.getQuantity() != null) {
                List<WarehouseAllocation> allocations = AllocationUtils.parse(item.getAllocations());
                if (!allocations.isEmpty()) {
                    for (WarehouseAllocation alloc : allocations) {
                        inventoryService.stockIn(item.getProductId(), alloc.getQuantity(),
                                alloc.getWarehouseId(), order.getOrderNo(), "SALES_OUT", "删除发货单-库存回退");
                    }
                } else if (order.getWarehouseId() != null) {
                    inventoryService.stockIn(item.getProductId(), item.getQuantity(),
                            order.getWarehouseId(), order.getOrderNo(), "SALES_OUT", "删除发货单-库存回退");
                }
            }
        }
        accountReceivableRepository.findByCustomerIdOrderByCreatedAtDesc(order.getCustomerId()).stream()
                .filter(ar -> order.getId().equals(ar.getOrderId()))
                .findFirst()
                .ifPresent(accountReceivableRepository::delete);
        salesOrderRepository.delete(order);
    }
}
