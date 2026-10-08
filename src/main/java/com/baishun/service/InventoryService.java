package com.baishun.service;

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
public class InventoryService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRecordRepository inventoryRecordRepository;

    @Autowired
    private WarehouseStockRepository warehouseStockRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    public void stockIn(Long productId, BigDecimal quantity, Long warehouseId, String orderNo, String recordType, String remark) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在: " + productId));

        if (warehouseId != null) {
            Warehouse wh = warehouseRepository.findById(warehouseId).orElse(null);
            if (wh != null && wh.getMaxCapacity() != null && wh.getMaxCapacity().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal used = warehouseStockRepository.sumQuantityByWarehouseId(warehouseId);
                if (used == null) used = BigDecimal.ZERO;
                if (used.add(quantity).compareTo(wh.getMaxCapacity()) > 0) {
                    throw new IllegalArgumentException("仓库「" + wh.getName() + "」容量不足：最大" +
                            wh.getMaxCapacity() + "，已用" + used + "，本次入库" + quantity);
                }
            }
        }

        BigDecimal currentStock = product.getCurrentStock() == null ? BigDecimal.ZERO : product.getCurrentStock();
        BigDecimal newStock = currentStock.add(quantity);
        product.setCurrentStock(newStock);
        productRepository.save(product);

        if (warehouseId != null) {
            WarehouseStock ws = warehouseStockRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                    .orElseGet(() -> {
                        WarehouseStock newWs = new WarehouseStock();
                        newWs.setProductId(productId);
                        newWs.setProductName(product.getName());
                        newWs.setWarehouseId(warehouseId);
                        Warehouse wh = warehouseRepository.findById(warehouseId).orElse(null);
                        if (wh != null) newWs.setWarehouseName(wh.getName());
                        newWs.setQuantity(BigDecimal.ZERO);
                        return newWs;
                    });
            ws.setQuantity(ws.getQuantity().add(quantity));
            warehouseStockRepository.save(ws);
        }

        InventoryRecord record = new InventoryRecord();
        record.setProductId(productId);
        record.setProductName(product.getName());
        record.setSpec(product.getSpec());
        record.setRecordType(recordType);
        record.setQuantity(quantity);
        record.setBalanceAfter(newStock);
        record.setRelatedOrderNo(orderNo);
        record.setRecordDate(LocalDate.now());
        record.setRemark(remark);
        record.setWarehouseId(warehouseId);
        if (warehouseId != null) {
            warehouseRepository.findById(warehouseId).ifPresent(w -> record.setWarehouseName(w.getName()));
        }
        record.setUnit(product.getUnit());
        inventoryRecordRepository.save(record);
    }

    public void stockOut(Long productId, BigDecimal quantity, Long warehouseId, String orderNo, String recordType, String remark) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在: " + productId));
        BigDecimal currentStock = product.getCurrentStock() == null ? BigDecimal.ZERO : product.getCurrentStock();
        if (currentStock.compareTo(quantity) < 0) {
            throw new IllegalArgumentException("库存不足: " + product.getName() +
                    " 当前库存" + currentStock + "，需要" + quantity);
        }

        if (warehouseId != null) {
            Warehouse wh = warehouseRepository.findById(warehouseId).orElse(null);
            String whName = wh != null ? wh.getName() : ("仓库#" + warehouseId);
            WarehouseStock ws = warehouseStockRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                    .orElse(null);
            BigDecimal wsQty = (ws != null && ws.getQuantity() != null) ? ws.getQuantity() : BigDecimal.ZERO;
            if (wsQty.compareTo(quantity) < 0) {
                throw new IllegalArgumentException("仓库「" + whName + "」中商品「" + product.getName() +
                        "」库存不足：该仓库现有" + wsQty + "，本次出库" + quantity);
            }
        }

        BigDecimal newStock = currentStock.subtract(quantity);
        product.setCurrentStock(newStock);
        productRepository.save(product);

        if (warehouseId != null) {
            WarehouseStock ws = warehouseStockRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                    .orElse(null);
            if (ws != null) {
                BigDecimal wsNewQty = ws.getQuantity().subtract(quantity);
                ws.setQuantity(wsNewQty);
                warehouseStockRepository.save(ws);
            }
        }

        InventoryRecord record = new InventoryRecord();
        record.setProductId(productId);
        record.setProductName(product.getName());
        record.setSpec(product.getSpec());
        record.setRecordType(recordType);
        record.setQuantity(quantity.negate());
        record.setBalanceAfter(newStock);
        record.setRelatedOrderNo(orderNo);
        record.setRecordDate(LocalDate.now());
        record.setRemark(remark);
        record.setWarehouseId(warehouseId);
        if (warehouseId != null) {
            warehouseRepository.findById(warehouseId).ifPresent(w -> record.setWarehouseName(w.getName()));
        }
        record.setUnit(product.getUnit());
        inventoryRecordRepository.save(record);
    }

    public void adjustStock(Long productId, BigDecimal diff, String remark) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在: " + productId));
        BigDecimal currentStock = product.getCurrentStock() == null ? BigDecimal.ZERO : product.getCurrentStock();
        BigDecimal newStock = currentStock.add(diff);
        if (newStock.compareTo(BigDecimal.ZERO) < 0) newStock = BigDecimal.ZERO;
        product.setCurrentStock(newStock);
        productRepository.save(product);

        InventoryRecord record = new InventoryRecord();
        record.setProductId(productId);
        record.setProductName(product.getName());
        record.setSpec(product.getSpec());
        record.setRecordType(diff.compareTo(BigDecimal.ZERO) > 0 ? "CHECK_GAIN" : "CHECK_LOSS");
        record.setQuantity(diff);
        record.setBalanceAfter(newStock);
        record.setRecordDate(LocalDate.now());
        record.setRemark(remark);
        record.setUnit(product.getUnit());
        inventoryRecordRepository.save(record);
    }

    public List<WarehouseStock> getProductWarehouseStock(Long productId) {
        return warehouseStockRepository.findByProductIdOrderByWarehouseNameAsc(productId);
    }

    public List<WarehouseStock> getWarehouseStock(Long warehouseId) {
        return warehouseStockRepository.findByWarehouseIdOrderByProductNameAsc(warehouseId);
    }

    public List<InventoryRecord> getProductLedger(Long productId) {
        return inventoryRecordRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public List<InventoryRecord> getProductLedgerByWarehouse(Long productId, Long warehouseId) {
        return inventoryRecordRepository.findByProductIdAndWarehouseIdOrderByCreatedAtDesc(productId, warehouseId);
    }

    public List<InventoryRecord> getRecords(LocalDate start, LocalDate end) {
        if (start != null && end != null) {
            return inventoryRecordRepository.findByRecordDateBetweenOrderByCreatedAtDesc(start, end);
        }
        return inventoryRecordRepository.findAll();
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    public List<Product> getAllProductsWithStock() {
        return productRepository.findAll();
    }
}
