package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.entity.Warehouse;
import com.baishun.service.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouses")
public class WarehouseController {

    @Autowired
    private WarehouseService warehouseService;

    @GetMapping
    public Result<List<Warehouse>> list(@RequestParam(required = false) String name) {
        return Result.success(warehouseService.search(name));
    }

    @GetMapping("/{id}")
    public Result<Warehouse> detail(@PathVariable Long id) {
        return Result.success(warehouseService.findById(id));
    }

    /** 获取所有仓库及容量信息 */
    @GetMapping("/capacity")
    public Result<List<Map<String, Object>>> capacity() {
        return Result.success(warehouseService.getWarehousesWithCapacity());
    }

    /** 获取可用于入库的仓库（有剩余容量的） */
    @GetMapping("/available-for-stockin")
    public Result<List<Map<String, Object>>> availableForStockIn() {
        return Result.success(warehouseService.getAvailableForStockIn());
    }

    /** 获取某商品有库存的仓库（用于出库选择） */
    @GetMapping("/available-for-stockout")
    public Result<List<Map<String, Object>>> availableForStockOut(@RequestParam Long productId) {
        return Result.success(warehouseService.getAvailableForStockOut(productId));
    }

    @PostMapping
    public Result<Warehouse> create(@RequestBody Warehouse warehouse) {
        return Result.success(warehouseService.save(warehouse));
    }

    @PutMapping("/{id}")
    public Result<Warehouse> update(@PathVariable Long id, @RequestBody Warehouse warehouse) {
        return Result.success(warehouseService.update(id, warehouse));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        warehouseService.delete(id);
        return Result.success();
    }
}
