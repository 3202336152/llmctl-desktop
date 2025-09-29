package com.llmctl.config;

import com.llmctl.entity.Session;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * SessionStatus 枚举类型处理器
 * 负责Java枚举与数据库VARCHAR类型之间的转换
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public class SessionStatusTypeHandler extends BaseTypeHandler<Session.SessionStatus> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, Session.SessionStatus parameter, JdbcType jdbcType) throws SQLException {
        ps.setString(i, parameter.getValue());
    }

    @Override
    public Session.SessionStatus getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String value = rs.getString(columnName);
        return value == null ? null : Session.SessionStatus.fromValue(value);
    }

    @Override
    public Session.SessionStatus getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String value = rs.getString(columnIndex);
        return value == null ? null : Session.SessionStatus.fromValue(value);
    }

    @Override
    public Session.SessionStatus getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String value = cs.getString(columnIndex);
        return value == null ? null : Session.SessionStatus.fromValue(value);
    }
}