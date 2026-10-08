package com.baishun.common;

import com.baishun.dto.WarehouseAllocation;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;

public class AllocationUtils {

    private static final ObjectMapper mapper = new ObjectMapper();

    public static List<WarehouseAllocation> parse(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            List<WarehouseAllocation> list = mapper.readValue(json, new TypeReference<List<WarehouseAllocation>>() {});
            return list != null ? list : Collections.emptyList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
