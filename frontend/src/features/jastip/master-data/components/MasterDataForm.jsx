import { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Typography,
} from "@mui/material";
import { AppButton, AppTextField } from "../../../../shared/components";

const initialStateByType = {
  division: { name: "" },
  department: { name: "", division_id: "" },
  vendor: { name: "", phone: "", address: "" },
  menu: {
    vendor_id: "",
    name: "",
    base_price: "",
    jastip_price: "",
  },
};

const getTitle = (type) => {
  switch (type) {
    case "department":
      return "Departemen";
    case "vendor":
      return "Vendor";
    case "menu":
      return "Menu";
    default:
      return "Divisi";
  }
};

const MasterDataForm = ({
  open,
  type,
  item,
  divisions = [],
  vendors = [],
  loading = false,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState(
    initialStateByType[type] || { name: "" },
  );

  useEffect(() => {
    const base = initialStateByType[type] || { name: "" };
    setFormData({
      ...base,
      ...Object.keys(base).reduce((acc, key) => {
        acc[key] = item?.[key] ?? base[key];
        return acc;
      }, {}),
    });
  }, [item, open, type]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = { ...formData };

    if (payload.name) payload.name = payload.name.trim();
    if (type === "department") {
      payload.division_id = Number(payload.division_id);
    }
    if (type === "menu") {
      payload.vendor_id = Number(payload.vendor_id);
      payload.base_price = Number(payload.base_price);
      payload.jastip_price = Number(payload.jastip_price);
    }

    if (type === "vendor") {
      payload.phone = payload.phone.trim();
      payload.address = payload.address.trim();
    }

    await onSubmit(payload);
  };

  const title = getTitle(type);
  const isDepartment = type === "department";
  const isVendor = type === "vendor";
  const isMenu = type === "menu";

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800, color: "#7A2E3A" }}>
        {item ? "Edit" : "Tambah"} {title}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="master-data-form"
          onSubmit={handleSubmit}
          sx={{ display: "grid", gap: 2, mt: 0.5 }}
        >
          <AppTextField
            label={
              isDepartment
                ? "Nama Departemen"
                : isVendor
                  ? "Nama Vendor"
                  : isMenu
                    ? "Nama Menu"
                    : "Nama Divisi"
            }
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          {isDepartment && (
            <AppTextField
              select
              label="Divisi"
              name="division_id"
              value={formData.division_id}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  const division = divisions.find(
                    (divisionItem) => divisionItem.id === Number(selected),
                  );
                  return division?.name || "Pilih Divisi";
                },
              }}
            >
              <MenuItem value="" disabled>
                Pilih Divisi
              </MenuItem>
              {divisions.map((division) => (
                <MenuItem key={division.id} value={division.id}>
                  {division.name}
                </MenuItem>
              ))}
            </AppTextField>
          )}

          {isVendor && (
            <>
              <AppTextField
                label="Nomor Telepon"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
              <AppTextField
                label="Alamat"
                name="address"
                value={formData.address}
                onChange={handleChange}
                multiline
                minRows={3}
              />
            </>
          )}

          {isMenu && (
            <>
              <AppTextField
                select
                label="Vendor"
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    const vendor = vendors.find(
                      (vendorItem) => vendorItem.id === Number(selected),
                    );
                    return vendor?.name || "Pilih Vendor";
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Pilih Vendor
                </MenuItem>
                {vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </AppTextField>
              <AppTextField
                label="Harga Pokok"
                name="base_price"
                type="number"
                value={formData.base_price}
                onChange={handleChange}
                required
              />
              <AppTextField
                label="Harga Jastip"
                name="jastip_price"
                type="number"
                value={formData.jastip_price}
                onChange={handleChange}
                required
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <AppButton variant="outlined" onClick={onClose} disabled={loading}>
          Batal
        </AppButton>
        <AppButton type="submit" form="master-data-form" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default MasterDataForm;