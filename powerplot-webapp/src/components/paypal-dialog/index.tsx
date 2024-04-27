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
import { AttachMoney } from "@mui/icons-material";

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement<any, any>;
  },
  ref: Ref<unknown>,
) {
  return <Fade ref={ref} {...props} />;
});

const PaypalDialog: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Fragment>
      <Tooltip title="Click here if you'd like to contribute to our bill via PayPal.">
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
        PaperProps={{
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            color: "#fff",
          },
        }}
      >
        <DialogTitle>{"Juuuust Kidding..."}</DialogTitle>
        <DialogContent>
          <DialogContentText
            id="alert-dialog-slide-description"
            style={{ color: "#fff" }}
          >
            You're a good soul for wanting to share your riches, though!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} style={{ color: "#fff" }}>
            I Agree
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
};

export default PaypalDialog;
