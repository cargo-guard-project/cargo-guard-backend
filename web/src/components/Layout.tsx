import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

export function Layout() {
  const { user, logout, canOperate, isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CG</span>
          <div className="brand-text">
            <strong>{t('appName')}</strong>
            {user?.role && <small className="role-pill">{user.role}</small>}
          </div>
        </div>
        <nav>
          <NavLink to="/">{t('dashboard')}</NavLink>
          <NavLink to="/shipments">{t('shipments')}</NavLink>
          <NavLink to="/cargo">{t('cargo')}</NavLink>
          <NavLink to="/containers">{t('containers')}</NavLink>
          <NavLink to="/incidents">{t('incidents')}</NavLink>
          {isAdmin && <NavLink to="/events">{t('eventLogs')}</NavLink>}
          {isAdmin && <NavLink to="/admin">{t('admin')}</NavLink>}
          {!canOperate && <span className="nav-note">{t('operatorOnly')}</span>}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <span className="muted">{user?.email}</span>
          </div>
          <div className="topbar-actions">
            <label className="compact-field">
              <span>{t('language')}</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'uk')}>
                <option value="en">{t('english')}</option>
                <option value="uk">{t('ukrainian')}</option>
              </select>
            </label>
            <button type="button" className="button secondary" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
