import { Switch, Route, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MyFiles from "@/pages/my-files";
import SharedFiles from "@/pages/shared-files";
import AuthPage from "@/pages/auth-page";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  const [isOnAuthPage] = useRoute('/auth');
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isOnAuthPage && <Header />}
      <main className={`flex-grow ${!isOnAuthPage ? 'container mx-auto py-6 px-4' : ''}`}>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/my-files" component={MyFiles} />
          <ProtectedRoute path="/shared" component={SharedFiles} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isOnAuthPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
