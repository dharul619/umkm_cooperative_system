import { Box, IconButton, Stack, Typography } from "@mui/material";
import FirstPageRounded from "@mui/icons-material/FirstPageRounded";
import LastPageRounded from "@mui/icons-material/LastPageRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";

const Pagination = ({ page, count, total, onPageChange, rowsPerPage = 20 }) => {
  const start = (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, total || 0);

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ px: 1 }}
    >
      <Typography variant="caption" color="text.secondary">
        Menampilkan {start}-{end} dari {total || 0}
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <IconButton
          size="small"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          <FirstPageRounded fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeftRounded fontSize="small" />
        </IconButton>

        <Box
          sx={{
            px: 2,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 48,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {page} / {count || 1}
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= count}
        >
          <ChevronRightRounded fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onPageChange(count)}
          disabled={page >= count}
        >
          <LastPageRounded fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  );
};

export default Pagination;
