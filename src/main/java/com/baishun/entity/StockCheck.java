package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "stock_check")
public class StockCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate checkDate;

    /** 盘点类型: DAILY-每日盘点, MONTHLY-月底盘点 */
    private String checkType = "DAILY";

    private String remark;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "stock_check_id")
    @ToString.Exclude
    private List<StockCheckItem> items = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
}
