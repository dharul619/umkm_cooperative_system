import { Card, CardContent } from "@mui/material";

const AppCard = ({ children, contentSx = {}, sx = {}, ...props }) => {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        overflow: "hidden",
        ...sx,
      }}
      {...props}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 }, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
};

export default AppCard;
