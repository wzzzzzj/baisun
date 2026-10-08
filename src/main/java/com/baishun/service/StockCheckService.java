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
public class StockCheckService {

    @Autowired
    private StockCheckRepository stockCheckRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryService inventoryService;

    public List<StockCheck> findAll() {
        return stockCheckRepository.findAllByOrderByCheckDateDescIdDesc();
    }

    public StockCheck findById(Long id) {
        return stockCheckRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("盘点记录不存在: " + id));
    }

    public StockCheck create(StockCheck stockCheck) {
        if (stockCheck.getCheckDate() == null) {
            stockCheck.setCheckDate(LocalDate.now());
        }
        if (stockCheck.getCheckType() == null) {
            stockCheck.setCheckType("DAILY");
        }

        for (StockCheckItem item : stockCheck.getItems()) {
            if (item.getProductId() != null) {
                Product product = productRepository.findById(item.getProductId()).orElse(null);
                if (product != null) {
                    item.setProductName(product.getName());
                    item.setSpec(product.getSpec());
                    item.setBookStock(product.getCurrentStock());

                    BigDecimal actual = item.getActualStock() != null ? item.getActualStock() : BigDecimal.ZERO;
                    BigDecimal book = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;
                    BigDecimal diff = actual.subtract(book);
                    item.setDiff(diff);
                    if (diff.compareTo(BigDecimal.ZERO) > 0) {
                        item.setDiffType("GAIN");
                    } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
                        item.setDiffType("LOSS");
                    } else {
                        item.setDiffType("NONE");
                    }
                }
            }
        }

        StockCheck saved = stockCheckRepository.save(stockCheck);

        for (StockCheckItem item : saved.getItems()) {
            if (item.getProductId() != null && item.getDiff() != null
                    && item.getDiff().compareTo(BigDecimal.ZERO) != 0) {
                inventoryService.adjustStock(item.getProductId(), item.getDiff(),
                        "盘点调整: " + (item.getDiffType().equals("GAIN") ? "盘盈" : "盘亏"));
            }
        }

        return saved;
    }
}
