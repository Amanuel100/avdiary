import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Market from './pages/Market';
import Journal from './pages/Journal';
import NewTrade from './pages/NewTrade';
import Messages from './pages/Messages';
import Subscription from './pages/Subscription';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Referral from './pages/Referral';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import LoginGate from './components/LoginGate';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FAQ from './pages/FAQ';
import SubscriptionGate from './components/SubscriptionGate';
import { UserProvider } from './context/UserContext';
import AdminLogin from './pages/AdminLogin';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('avdiary-token'));

  return (
    <UserProvider>
      <Routes>
        {/* Public home page */}
        <Route path="/" element={<Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />

        {/* Auth pages */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/register" element={<Register setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/admin-login" element={<AdminLogin setIsLoggedIn={setIsLoggedIn} />} />

        {/* Protected pages – require login first, then subscription for premium features */}
        <Route path="/dashboard" element={
          <LoginGate isLoggedIn={isLoggedIn}>
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <SubscriptionGate>
                <Dashboard />
              </SubscriptionGate>
            </Layout>
          </LoginGate>
        } />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/market" element={
          <LoginGate isLoggedIn={isLoggedIn}>
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <SubscriptionGate>
                <Market />
              </SubscriptionGate>
            </Layout>
          </LoginGate>
        } />
        <Route path="/journal" element={
          <LoginGate isLoggedIn={isLoggedIn}>
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <SubscriptionGate>
                <Journal />
              </SubscriptionGate>
            </Layout>
          </LoginGate>
        } />
        <Route path="/journal/new" element={
          <LoginGate isLoggedIn={isLoggedIn}>
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <SubscriptionGate>
                <NewTrade />
              </SubscriptionGate>
            </Layout>
          </LoginGate>
        } />
        <Route path="/chat" element={
          <LoginGate isLoggedIn={isLoggedIn}>
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <SubscriptionGate>
                <Chat />
              </SubscriptionGate>
            </Layout>
          </LoginGate>
        } />

        {/* Admin panel – NO LoginGate; Admin component checks auth + role itself */}
        <Route path="/aman" element={
          <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
            <Admin />
          </Layout>
        } />

        {/* Pages that require login but NOT subscription */}
        <Route path="/messages" element={
          <LoginGate isLoggedIn={isLoggedIn}>
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <Messages />
            </Layout>
          </LoginGate>
        } />
        <Route path="/referral" element={
          <LoginGate isLoggedIn={isLoggedIn}>
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <Referral />
            </Layout>
          </LoginGate>
        } />
        <Route path="/profile" element={
          <LoginGate isLoggedIn={isLoggedIn}>
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <Profile />
            </Layout>
          </LoginGate>
        } />
        <Route path="/subscription" element={
          <LoginGate isLoggedIn={isLoggedIn}>
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <Subscription />
            </Layout>
          </LoginGate>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </UserProvider>
  );
}