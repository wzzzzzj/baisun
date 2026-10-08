package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.entity.InventoryRecord;
import com.baishun.entity.Product;
import com.baishun.entity.WarehouseStock;
import com.baishun.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping("/products")
    public Result<List<Product>> products() {
        return Result.success(inventoryService.getAllProductsWithStock());
    }

    @GetMapping("/products/{id}/ledger")
    public Result<List<InventoryRecord>> productLedger(@PathVariable Long id) {
        return Result.success(inventoryService.getProductLedger(id));
    }

    @GetMapping("/products/{productId}/warehouses/{warehouseId}/ledger")
    public Result<List<InventoryRecord>> productLedgerByWarehouse(
            @PathVariable Long productId,
            @PathVariable Long warehouseId) {
        return Result.success(inventoryService.getProductLedgerByWarehouse(productId, warehouseId));
    }

    @GetMapping("/low-stock")
    public Result<List<Product>> lowStock() {
        return Result.success(inventoryService.getLowStockProducts());
    }

    @GetMapping("/records")
    public Result<List<InventoryRecord>> records(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return Result.success(inventoryService.getRecords(startDate, endDate));
    }

    @GetMapping("/products/{id}/warehouses")
    public Result<List<WarehouseStock>> productWarehouseStock(@PathVariable Long id) {
        return Result.success(inventoryService.getProductWarehouseStock(id));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public Result<List<WarehouseStock>> warehouseStock(@PathVariable Long warehouseId) {
        return Result.success(inventoryService.getWarehouseStock(warehouseId));
    }
}
