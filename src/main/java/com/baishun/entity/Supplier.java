package com.baishun.entity;

import jakarta.persistence.*;
import lombok.Data;
import jakarta.persistence.Transient;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "supplier")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    /** 类型: FACTORY-厂家, MARKET-市场同行 */
    private String type = "FACTORY";

    private String contactPerson;

    private String phone;

    private String address;

    private String remark;

    @Transient
    private BigDecimal balance = BigDecimal.ZERO;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
