package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.entity.StockCheck;
import com.baishun.service.StockCheckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-checks")
public class StockCheckController {

    @Autowired
    private StockCheckService stockCheckService;

    @GetMapping
    public Result<List<StockCheck>> list() {
        return Result.success(stockCheckService.findAll());
    }

    @GetMapping("/{id}")
    public Result<StockCheck> detail(@PathVariable Long id) {
        return Result.success(stockCheckService.findById(id));
    }

    @PostMapping
    public Result<StockCheck> create(@RequestBody StockCheck stockCheck) {
        return Result.success(stockCheckService.create(stockCheck));
    }
}
