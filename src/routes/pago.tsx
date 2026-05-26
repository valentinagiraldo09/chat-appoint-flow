import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/pago")({
  head: () => ({ meta: [{ title: "Pago de la cita" }] }),
  component: PagoRedirect,
});

function PagoRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/confirmacion", replace: true });
  }, [navigate]);
  return null;
}
