import { useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import EmptyState from "./EmptyState";
import Loading from "./Loading";

const getCellValue = (row, column) => {
  if (typeof column.sortValue === "function") {
    return column.sortValue(row);
  }

  return row[column.field];
};

const compareValues = (a, b) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const DataTable = ({
  columns = [],
  rows = [],
  getRowId = (row) => row.id,
  loading = false,
  emptyTitle = "Data belum tersedia",
  emptyDescription,
  actions = [],
  dense = false,
  sx = {},
}) => {
  const [sortConfig, setSortConfig] = useState({ field: null, direction: "asc" });

  const sortedRows = useMemo(() => {
    if (!sortConfig.field) return rows;

    const column = columns.find((item) => item.field === sortConfig.field);
    if (!column) return rows;

    const sorted = [...rows].sort((rowA, rowB) => {
      const valueA = getCellValue(rowA, column);
      const valueB = getCellValue(rowB, column);
      return compareValues(valueA, valueB);
    });

    return sortConfig.direction === "asc" ? sorted : sorted.reverse();
  }, [columns, rows, sortConfig]);

  const handleSort = (field, sortable) => {
    if (!sortable) return;

    setSortConfig((current) => {
      if (current.field === field) {
        return {
          field,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return { field, direction: "asc" };
    });
  };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid #F9D5DC", ...sx }}>
        <Loading message="Memuat data tabel..." />
      </Paper>
    );
  }

  if (!rows.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        sx={{ ...sx }}
      />
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: "1px solid #F9D5DC",
        borderRadius: 2,
        overflow: "hidden",
        ...sx,
      }}
    >
      <Table size={dense ? "small" : "medium"}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#FFF1F3" }}>
            {columns.map((column) => {
              const sortable = column.sortable !== false;
              const active = sortConfig.field === column.field;

              return (
                <TableCell
                  key={column.field}
                  align={column.align || "left"}
                  sortDirection={active ? sortConfig.direction : false}
                  sx={{
                    width: column.width,
                    minWidth: column.minWidth,
                    color: "#7A2E3A",
                    fontWeight: 700,
                    borderBottom: "1px solid #F9D5DC",
                    cursor: sortable ? "pointer" : "default",
                    userSelect: "none",
                  }}
                  onClick={() => handleSort(column.field, sortable)}
                >
                  <TableSortLabel
                    active={active}
                    direction={active ? sortConfig.direction : "asc"}
                    hideSortIcon={!sortable}
                    disabled={!sortable}
                    sx={{
                      color: "inherit !important",
                      "& .MuiTableSortLabel-icon": {
                        color: "#C93F58 !important",
                      },
                    }}
                  >
                    {column.headerName || column.label}
                  </TableSortLabel>
                </TableCell>
              );
            })}
            {!!actions.length && (
              <TableCell
                align="center"
                sx={{
                  width: 120,
                  color: "#7A2E3A",
                  fontWeight: 700,
                  borderBottom: "1px solid #F9D5DC",
                }}
              >
                Aksi
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRows.map((row, rowIndex) => (
            <TableRow
              key={getRowId(row)}
              hover
              sx={{
                "&:last-child td": { borderBottom: 0 },
              }}
            >
              {columns.map((column) => {
                const value = row[column.field];

                return (
                  <TableCell
                    key={column.field}
                    align={column.align || "left"}
                    sx={{ borderColor: "#FDE8EC" }}
                  >
                    {column.render ? (
                      column.render(value, row, rowIndex)
                    ) : (
                      <Typography variant="body2">{value ?? "-"}</Typography>
                    )}
                  </TableCell>
                );
              })}
              {!!actions.length && (
                <TableCell align="right" sx={{ borderColor: "#FDE8EC" }}>
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    {actions.map((action) => {
                      const disabled = action.disabled?.(row);
                      const Icon = action.icon;

                      return (
                        <Tooltip key={action.label} title={action.label}>
                          <span>
                            <IconButton
                              size="small"
                              color={action.color || "primary"}
                              disabled={disabled}
                              onClick={() => action.onClick?.(row)}
                            >
                              {Icon && <Icon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
