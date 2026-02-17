import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AppShell from "../components/AppShell";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Books from "../pages/Books";
import Members from "../pages/Members";
import Loans from "../pages/Loans";
import Late from "../pages/Late_temp"; // <-- ton fichier actuel
import BookDetails from "../pages/BookDetails";

function PrivateLayout({ children }) {
  const isAuth = !!localStorage.getItem("token");
  return isAuth ? children : <Navigate to="/login" />;
}

function PrivatePage({ children }) {
  return (
    <PrivateLayout>
      <Navbar />
      <AppShell>{children}</AppShell>
    </PrivateLayout>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<PrivatePage><Dashboard /></PrivatePage>} />
        <Route path="/books" element={<PrivatePage><Books /></PrivatePage>} />
        <Route path="/books/:id" element={<PrivatePage><BookDetails /></PrivatePage>} />
        <Route path="/members" element={<PrivatePage><Members /></PrivatePage>} />
        <Route path="/loans" element={<PrivatePage><Loans /></PrivatePage>} />
        <Route path="/late" element={<PrivatePage><Late /></PrivatePage>} />
      </Routes>
    </BrowserRouter>
  );
}
