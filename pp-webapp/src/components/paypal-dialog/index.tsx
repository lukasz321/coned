import { Ref, ReactElement, forwardRef, Fragment, useState } from "react";
import { TransitionProps } from "@mui/material/transitions";

import {
  IconButton,
  Button,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fade,
} from "@mui/material";
import {
  List,
  AttachMoney,
  Code,
  HelpOutline,
  AlternateEmail,
  ErrorOutline,
  Done,
} from "@mui/icons-material";

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement<any, any>;
  },
  ref: Ref<unknown>,
) {
  return <Fade ref={ref} {...props} />;
});

export default function PaypalDialog() {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Fragment>
      <Tooltip title="Want to contribute to our bill? Here's the PayPal.">
        <IconButton size="large">
          <AttachMoney
            style={{ color: "#fff", opacity: 0.8 }}
            onClick={() => {
              setOpen(true);
            }}
          />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>{"Juuuust Kidding..."}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            You're a good soul for wanting to share your riches, though!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>I Agree</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
