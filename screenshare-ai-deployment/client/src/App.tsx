import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LaptopView from "@/pages/laptop";
import MobileView from "@/pages/mobile";
import PairingView from "@/pages/pairing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={PairingView} />
      <Route path="/laptop" component={LaptopView} />
      <Route path="/mobile" component={MobileView} />
      <Route path="/pairing" component={PairingView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
