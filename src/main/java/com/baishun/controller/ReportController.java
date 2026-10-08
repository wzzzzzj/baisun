package com.baishun.controller;

import com.baishun.common.Result;
import com.baishun.dto.DashboardDTO;
import com.baishun.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/dashboard")
    public Result<DashboardDTO> dashboard() {
        return Result.success(reportService.getDashboard());
    }

    @GetMapping("/daily")
    public Result<DashboardDTO> daily(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return Result.success(reportService.getDailyReport(date));
    }

    @GetMapping("/monthly")
    public Result<Map<String, Object>> monthly(@RequestParam int year, @RequestParam int month) {
        return Result.success(reportService.getMonthlyReport(year, month));
    }
}
