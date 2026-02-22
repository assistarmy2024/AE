import { useEffect } from "react";
import { AIDesktop } from "@/layouts/AIDesktop";
import { useAEOSStore } from "@/store/useAEOSStore";

export default function App() {
  const connectGateway = useAEOSStore((s) => s.connectGateway);

  // Auto-connect to the gateway on startup using persisted settings
  useEffect(() => {
    connectGateway();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <AIDesktop />;
}
