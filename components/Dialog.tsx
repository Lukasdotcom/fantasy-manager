import { Dialog, DialogTitle, Icon, IconButton } from "@mui/material";
import { MouseEventHandler } from "react";
interface Props {
  children: JSX.Element;
  onClose: MouseEventHandler;
  title: string;
  open: boolean;
}
// A simple dialog
export default function Home({ children, onClose, title, open }: Props) {
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
