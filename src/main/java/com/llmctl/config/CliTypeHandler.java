package com.llmctl.config;

import com.llmctl.entity.ProviderConfig;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedTypes;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * CliType 枚举的 MyBatis 类型处理器
 *
 * 支持两种输入类型：
 * 1. ProviderConfig.CliType 枚举类型
 * 2. String 字符串类型
 *
 * @author Liu Yifan
 * @version 2.3.0
 * @since 2025-01-15
 */
@MappedTypes(ProviderConfig.CliType.class)
public class CliTypeHandler extends BaseTypeHandler<Object> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, Object parameter, JdbcType jdbcType) throws SQLException {
        // 支持两种类型：枚举和字符串
        if (parameter instanceof ProviderConfig.CliType) {
            // 如果是枚举，直接获取值
            ps.setString(i, ((ProviderConfig.CliType) parameter).getValue());
        } else if (parameter instanceof String) {
            // 如果是字符串，直接使用
            ps.setString(i, (String) parameter);
        } else {
            throw new IllegalArgumentException(
                "CliTypeHandler 只支持 ProviderConfig.CliType 或 String 类型，但收到: " +
                parameter.getClass().getName()
            );
        }
    }

    @Override
    public ProviderConfig.CliType getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String value = rs.getString(columnName);
        return value == null ? null : ProviderConfig.CliType.fromValue(value);
    }

    @Override
    public ProviderConfig.CliType getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String value = rs.getString(columnIndex);
        return value == null ? null : ProviderConfig.CliType.fromValue(value);
    }

    @Override
    public ProviderConfig.CliType getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String value = cs.getString(columnIndex);
        return value == null ? null : ProviderConfig.CliType.fromValue(value);
    }
}
