package com.llmctl.config;

import com.llmctl.entity.EmailVerificationCode;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Purpose 枚举类型处理器
 * 负责Java枚举与数据库VARCHAR类型之间的转换
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-14
 */
public class PurposeTypeHandler extends BaseTypeHandler<EmailVerificationCode.Purpose> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, EmailVerificationCode.Purpose parameter, JdbcType jdbcType) throws SQLException {
        ps.setString(i, parameter.getValue());
    }

    @Override
    public EmailVerificationCode.Purpose getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String value = rs.getString(columnName);
        return value == null ? null : EmailVerificationCode.Purpose.fromValue(value);
    }

    @Override
    public EmailVerificationCode.Purpose getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String value = rs.getString(columnIndex);
        return value == null ? null : EmailVerificationCode.Purpose.fromValue(value);
    }

    @Override
    public EmailVerificationCode.Purpose getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String value = cs.getString(columnIndex);
        return value == null ? null : EmailVerificationCode.Purpose.fromValue(value);
    }
}
