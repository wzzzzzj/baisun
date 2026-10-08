package com.baishun.service;

import com.baishun.entity.Warehouse;
import com.baishun.entity.WarehouseStock;
import com.baishun.repository.WarehouseRepository;
import com.baishun.repository.WarehouseStockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WarehouseService {

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private WarehouseStockRepository warehouseStockRepository;

    public List<Warehouse> search(String name) {
        if (name != null && !name.isBlank()) {
            return warehouseRepository.findByNameContainingOrderByIdDesc(name);
        }
        return warehouseRepository.findAll();
    }

    public Warehouse findById(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("仓库不存在: " + id));
    }

    public Warehouse save(Warehouse warehouse) {
        if (warehouse.getMaxCapacity() == null) {
            warehouse.setMaxCapacity(BigDecimal.ZERO);
        }
        return warehouseRepository.save(warehouse);
    }

    public Warehouse update(Long id, Warehouse warehouse) {
        Warehouse existing = findById(id);
        existing.setName(warehouse.getName());
        existing.setCode(warehouse.getCode());
        existing.setLocation(warehouse.getLocation());
        existing.setMaxCapacity(warehouse.getMaxCapacity() != null ? warehouse.getMaxCapacity() : BigDecimal.ZERO);
        existing.setRemark(warehouse.getRemark());
        return warehouseRepository.save(existing);
    }

    public void delete(Long id) {
        warehouseRepository.deleteById(id);
    }

    /** 获取仓库当前已用容量 */
    public BigDecimal getCurrentUsed(Long warehouseId) {
        BigDecimal used = warehouseStockRepository.sumQuantityByWarehouseId(warehouseId);
        return used != null ? used : BigDecimal.ZERO;
    }

    /** 获取仓库剩余容量 */
    public BigDecimal getRemainingCapacity(Long warehouseId) {
        Warehouse wh = findById(warehouseId);
        BigDecimal maxCap = wh.getMaxCapacity() != null ? wh.getMaxCapacity() : BigDecimal.ZERO;
        BigDecimal used = getCurrentUsed(warehouseId);
        BigDecimal remaining = maxCap.subtract(used);
        return remaining.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : remaining;
    }

    /** 获取所有仓库及容量信息 */
    public List<Map<String, Object>> getWarehousesWithCapacity() {
        List<Warehouse> warehouses = warehouseRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Warehouse wh : warehouses) {
            Map<String, Object> info = new HashMap<>();
            info.put("id", wh.getId());
            info.put("name", wh.getName());
            info.put("code", wh.getCode());
            info.put("location", wh.getLocation());
            info.put("maxCapacity", wh.getMaxCapacity() != null ? wh.getMaxCapacity() : BigDecimal.ZERO);
            BigDecimal used = getCurrentUsed(wh.getId());
            info.put("currentUsed", used);
            BigDecimal maxCap = wh.getMaxCapacity() != null ? wh.getMaxCapacity() : BigDecimal.ZERO;
            BigDecimal remaining = maxCap.subtract(used);
            info.put("remainingCapacity", remaining.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : remaining);
            info.put("remark", wh.getRemark());
            result.add(info);
        }
        return result;
    }

    /** 获取可用于入库的仓库（有剩余容量的） */
    public List<Map<String, Object>> getAvailableForStockIn() {
        List<Map<String, Object>> all = getWarehousesWithCapacity();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> wh : all) {
            BigDecimal remaining = (BigDecimal) wh.get("remainingCapacity");
            BigDecimal maxCap = (BigDecimal) wh.get("maxCapacity");
            // 只要有剩余容量就显示（maxCapacity为0表示未设置限制，也显示）
            if (maxCap == null || maxCap.compareTo(BigDecimal.ZERO) == 0 || remaining.compareTo(BigDecimal.ZERO) > 0) {
                result.add(wh);
            }
        }
        return result;
    }

    /** 获取某商品有库存的仓库（用于出库选择） */
    public List<Map<String, Object>> getAvailableForStockOut(Long productId) {
        List<WarehouseStock> stocks = warehouseStockRepository.findByProductIdOrderByWarehouseNameAsc(productId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (WarehouseStock ws : stocks) {
            if (ws.getQuantity() != null && ws.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> info = new HashMap<>();
                info.put("warehouseId", ws.getWarehouseId());
                info.put("warehouseName", ws.getWarehouseName());
                info.put("availableStock", ws.getQuantity());
                result.add(info);
            }
        }
        return result;
    }

    /** 检查仓库容量是否足够 */
    public void checkCapacity(Long warehouseId, BigDecimal quantity) {
        Warehouse wh = warehouseRepository.findById(warehouseId).orElse(null);
        if (wh == null) return;
        BigDecimal maxCap = wh.getMaxCapacity();
        if (maxCap == null || maxCap.compareTo(BigDecimal.ZERO) <= 0) return; // 未设置容量限制
        BigDecimal used = getCurrentUsed(warehouseId);
        if (used.add(quantity).compareTo(maxCap) > 0) {
            throw new IllegalArgumentException("仓库「" + wh.getName() + "」容量不足：最大" +
                    maxCap + "，已用" + used + "，本次入库" + quantity + "，超出" +
                    used.add(quantity).subtract(maxCap));
        }
    }
}
