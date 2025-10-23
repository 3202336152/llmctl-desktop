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
 * @author Liu Yifan
 * @version 2.3.0
 * @since 2025-01-15
 */
@MappedTypes(ProviderConfig.CliType.class)
public class CliTypeHandler extends BaseTypeHandler<ProviderConfig.CliType> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, ProviderConfig.CliType parameter, JdbcType jdbcType) throws SQLException {
        // 将枚举转换为数据库值
        ps.setString(i, parameter.getValue());
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
