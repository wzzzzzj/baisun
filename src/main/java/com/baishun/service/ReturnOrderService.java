package com.baishun.service;

import com.baishun.common.OrderNoGenerator;
import com.baishun.entity.*;
import com.baishun.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ReturnOrderService {

    @Autowired
    private ReturnOrderRepository returnOrderRepository;
    @Autowired
    private InventoryService inventoryService;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private SupplierRepository supplierRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private WarehouseRepository warehouseRepository;

    @Transactional
    public ReturnOrder create(ReturnOrder order) {
        order.setOrderNo(OrderNoGenerator.generateReturnNo());
        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDate.now());
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (ReturnOrderItem item : order.getItems()) {
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
            if (item.getProductId() != null) {
                productRepository.findById(item.getProductId()).ifPresent(p -> {
                    item.setProductName(p.getName());
                    item.setUnit(p.getUnit());
                    item.setSpec(p.getSpec());
                    item.setColor(p.getColor());
                });
            }
        }
        order.setTotalAmount(totalAmount);

        BigDecimal grandTotal = totalAmount;
        if (order.getFreight() != null) grandTotal = grandTotal.add(order.getFreight());
        if (order.getMiscFee() != null) grandTotal = grandTotal.add(order.getMiscFee());
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
            order.setPayStatus("UNPAID");
        }

        if (order.getWarehouseId() != null) {
            warehouseRepository.findById(order.getWarehouseId()).ifPresent(w -> order.setWarehouseName(w.getName()));
        }

        String targetType = order.getReturnType();
        if ("SUPPLIER".equals(targetType) && order.getTargetId() != null) {
            supplierRepository.findById(order.getTargetId()).ifPresent(s -> {
                order.setTargetName(s.getName());
                order.setContactPerson(s.getContactPerson());
                order.setPhone(s.getPhone());
            });
        } else if ("CUSTOMER".equals(targetType) && order.getTargetId() != null) {
            customerRepository.findById(order.getTargetId()).ifPresent(c -> {
                order.setTargetName(c.getName());
                order.setPhone(c.getPhone());
            });
        }

        ReturnOrder saved = returnOrderRepository.save(order);

        for (ReturnOrderItem item : saved.getItems()) {
            if (item.getProductId() == null || item.getQuantity() == null) continue;
            if ("SUPPLIER".equals(targetType)) {
                inventoryService.stockOut(item.getProductId(), item.getQuantity(),
                        saved.getWarehouseId(), saved.getOrderNo(), "RETURN_OUT", "退货给供应商");
            } else if ("CUSTOMER".equals(targetType)) {
                inventoryService.stockIn(item.getProductId(), item.getQuantity(),
                        saved.getWarehouseId(), saved.getOrderNo(), "RETURN_IN", "客户退货入库");
            }
        }

        return saved;
    }

    public List<ReturnOrder> search(LocalDate startDate, LocalDate endDate, String returnType, Long targetId) {
        return returnOrderRepository.search(startDate, endDate, returnType, targetId);
    }

    public ReturnOrder getById(Long id) {
        return returnOrderRepository.findById(id).orElse(null);
    }

    @Transactional
    public void delete(Long id) {
        ReturnOrder order = returnOrderRepository.findById(id).orElse(null);
        if (order == null) return;

        String targetType = order.getReturnType();
        for (ReturnOrderItem item : order.getItems()) {
            if (item.getProductId() == null || item.getQuantity() == null) continue;
            if ("SUPPLIER".equals(targetType)) {
                inventoryService.stockIn(item.getProductId(), item.getQuantity(),
                        order.getWarehouseId(), order.getOrderNo(), "RETURN_OUT_REVERSE", "退货删除回库");
            } else if ("CUSTOMER".equals(targetType)) {
                inventoryService.stockOut(item.getProductId(), item.getQuantity(),
                        order.getWarehouseId(), order.getOrderNo(), "RETURN_IN_REVERSE", "退货删除出库");
            }
        }

        returnOrderRepository.delete(order);
    }
}