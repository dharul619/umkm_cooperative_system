import { Card, CardContent } from "@mui/material";

const AppCard = ({ children, contentSx = {}, sx = {}, ...props }) => {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #F9D5DC",
        borderRadius: 2,
        backgroundColor: "#FFFFFF",
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
