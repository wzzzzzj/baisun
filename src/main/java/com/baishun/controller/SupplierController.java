package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.entity.Supplier;
import com.baishun.service.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    @GetMapping
    public Result<List<Supplier>> list(@RequestParam(required = false) String name,
                                       @RequestParam(required = false) String type) {
        return Result.success(supplierService.search(name, type));
    }

    @GetMapping("/{id}")
    public Result<Supplier> detail(@PathVariable Long id) {
        return Result.success(supplierService.findById(id));
    }

    @PostMapping
    public Result<Supplier> create(@RequestBody Supplier supplier) {
        return Result.success(supplierService.save(supplier));
    }

    @PutMapping("/{id}")
    public Result<Supplier> update(@PathVariable Long id, @RequestBody Supplier supplier) {
        return Result.success(supplierService.update(id, supplier));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        supplierService.delete(id);
        return Result.success();
    }
}
