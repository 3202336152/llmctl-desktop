package com.llmctl.config;

import com.llmctl.entity.Provider;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedTypes;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * TokenStrategyType 枚举的 MyBatis 类型处理器
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
@MappedTypes(Provider.TokenStrategyType.class)
public class TokenStrategyTypeHandler extends BaseTypeHandler<Provider.TokenStrategyType> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, Provider.TokenStrategyType parameter, JdbcType jdbcType) throws SQLException {
        // 将枚举转换为数据库值
        ps.setString(i, parameter.getValue());
    }

    @Override
    public Provider.TokenStrategyType getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String value = rs.getString(columnName);
        return value == null ? null : Provider.TokenStrategyType.fromValue(value);
    }

    @Override
    public Provider.TokenStrategyType getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String value = rs.getString(columnIndex);
        return value == null ? null : Provider.TokenStrategyType.fromValue(value);
    }

    @Override
    public Provider.TokenStrategyType getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String value = cs.getString(columnIndex);
        return value == null ? null : Provider.TokenStrategyType.fromValue(value);
    }
}