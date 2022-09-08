import { Dialog, DialogTitle, Icon, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
// A simple dialog
export default function Home({ children, onClose, title, open }) {
  return (
    <Dialog open={open}>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {title}
        {onClose ? (
          <IconButton
            id="close"
            aria-label="close"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Icon>close</Icon>
          </IconButton>
        ) : null}
      </DialogTitle>
      {children}
    </Dialog>
  );
}
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));
