package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.entity.Product;
import com.baishun.entity.WarehouseStock;
import com.baishun.service.InventoryService;
import com.baishun.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    public Result<List<Product>> list(@RequestParam(required = false) String name) {
        return Result.success(productService.search(name));
    }

    @GetMapping("/{id}")
    public Result<Product> detail(@PathVariable Long id) {
        return Result.success(productService.findById(id));
    }

    @PostMapping
    public Result<Product> create(@RequestBody Product product) {
        return Result.success(productService.save(product));
    }

    @PutMapping("/{id}")
    public Result<Product> update(@PathVariable Long id, @RequestBody Product product) {
        return Result.success(productService.update(id, product));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        productService.delete(id);
        return Result.success();
    }

    @GetMapping("/low-stock")
    public Result<List<Product>> lowStock() {
        return Result.success(productService.findLowStock());
    }

    @GetMapping("/{id}/warehouses")
    public Result<List<WarehouseStock>> productWarehouses(@PathVariable Long id) {
        return Result.success(inventoryService.getProductWarehouseStock(id));
    }
}
