import { Card, CardContent } from "@mui/material";

const AppCard = ({ children, contentSx = {}, sx = {}, hoverable = false, ...props }) => {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #E5E7EB",
        borderRadius: 3,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        overflow: "hidden",
        ...(hoverable && {
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)",
            borderColor: "primary.light",
          },
        }),
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
