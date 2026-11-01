import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import './App.css';

const API_BASE_URL = 'https://inai-col2.fishrungames.com';

const ENDPOINTS = {
  register: `${API_BASE_URL}/api/register/`,
  login: `${API_BASE_URL}/api/login/`,
  logout: `${API_BASE_URL}/api/logout/`,
  profile: `${API_BASE_URL}/api/profile/`,
  specializations: `${API_BASE_URL}/api/specializations/`,
};

const inputStyle: CSSProperties = {
  backgroundColor: '#0b0f19',
  color: '#ffffff',
  WebkitTextFillColor: '#ffffff',
  caretColor: '#38bdf8',
  border: '2px solid rgba(59, 130, 246, 0.3)',
  padding: '13px 16px',
  fontSize: '1rem',
  fontWeight: 600,
  width: '100%',
  borderRadius: '8px',
};

interface SpecializationItem {
  value: string;
  label: string;
}

interface MusicianData {
  id?: number;
  username: string;
  email?: string;
  profile?: {
    first_name?: string;
    specialization?: string;
    specialization_display?: string;
    bio?: string;
    fee?: string | number;
  };
}

type Mode = 'login' | 'register';

function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('Загрузка портала...');

  const [isLogged, setIsLogged] = useState<boolean>(
    Boolean(localStorage.getItem('band_session'))
  );

  const [mode, setMode] = useState<Mode>('login');

  const [errorText, setErrorText] = useState<string | null>(null);
  const [okText, setOkText] = useState<string | null>(null);

  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');

  const [musician, setMusician] = useState<MusicianData | null>(null);

  const [specList, setSpecList] = useState<SpecializationItem[]>([
    { value: 'vocal', label: 'Вокал' },
    { value: 'guitar', label: 'Гитара' },
    { value: 'bass', label: 'Бас-гитара' },
    { value: 'drums', label: 'Ударные' },
    { value: 'keys', label: 'Клавишные' },
    { value: 'other', label: 'Другое' },
  ]);

  const [editMode, setEditMode] = useState<boolean>(false);
  const [firstNameForm, setFirstNameForm] = useState<string>('');
  const [specForm, setSpecForm] = useState<string>('other');
  const [bioForm, setBioForm] = useState<string>('');
  const [feeForm, setFeeForm] = useState<string>('0.00');

  const triggerLoader = (msg: string) => {
    setErrorText(null);
    setOkText(null);
    setLoadingStep(msg);
    setLoading(true);
  };

  useEffect(() => {
    fetchSpecializations();

    if (isLogged) {
      loadMyProfile();
    }
  }, [isLogged]);

  const fetchSpecializations = async () => {
    try {
      const res = await fetch(ENDPOINTS.specializations);

      if (res.ok) {
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item: Record<string, string>) => ({
            value: item.value || item.key || item.code || 'other',
            label: item.label || item.name || item.display || 'Другое',
          }));

          setSpecList(formatted);
        }
      }
    } catch {
      // Использовать дефолтные специализации
    }
  };

  const syncProfileState = (data: MusicianData) => {
    setMusician(data);
    setFirstNameForm(data.profile?.first_name || '');
    setSpecForm(data.profile?.specialization || 'other');
    setBioForm(data.profile?.bio || '');
    setFeeForm(String(data.profile?.fee ?? '0.00'));
  };

  const loadMyProfile = async () => {
    triggerLoader('Загружаем профиль...');

    try {
      const response = await fetch(ENDPOINTS.profile, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Сессия истекла (${response.status})`);
      }

      const data: MusicianData = await response.json();
      syncProfileState(data);
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : 'Ошибка чтения профиля';

      setErrorText(msg);
      localStorage.removeItem('band_session');
      setIsLogged(false);
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    triggerLoader('Регистрируем аккаунт...');

    try {
      const response = await fetch(ENDPOINTS.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: usernameInput,
          email: emailInput,
          password: passwordInput,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.username?.[0] ||
          data.password?.[0] ||
          'Ошибка регистрации'
        );
      }

      setOkText('Регистрация успешна! Войдите в систему.');
      setMode('login');
      setPasswordInput('');
    } catch (err) {
      setErrorText(
        err instanceof Error ? err.message : 'Ошибка регистрации'
      );
    } finally {
      setLoading(false);
    }
  };

  const onLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    triggerLoader('Авторизация...');

    try {
      const response = await fetch(ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.non_field_errors?.[0] ||
          'Неверный логин или пароль'
        );
      }

      localStorage.setItem('band_session', data.username || 'active');
      setIsLogged(true);
      syncProfileState(data);
      setPasswordInput('');
      setOkText('Вход выполнен успешно!');
    } catch (err) {
      setErrorText(
        err instanceof Error ? err.message : 'Ошибка входа'
      );
    } finally {
      setLoading(false);
    }
  };

  const onUpdateProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    triggerLoader('Сохранение изменений...');

    try {
      const payload = {
        first_name: firstNameForm,
        specialization: specForm,
        bio: bioForm,
        fee: feeForm,
        profile: {
          first_name: firstNameForm,
          specialization: specForm,
          bio: bioForm,
          fee: feeForm,
        },
      };

      const response = await fetch(ENDPOINTS.profile, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка сохранения профиля');
      }

      if (data.profile) {
        syncProfileState(data);
      } else {
        syncProfileState({
          ...musician,
          username: musician?.username || usernameInput,
          profile: {
            first_name: data.first_name ?? firstNameForm,
            specialization: data.specialization ?? specForm,
            specialization_display:
              data.specialization_display ??
              specList.find((s) => s.value === specForm)?.label ??
              specForm,
            bio: data.bio ?? bioForm,
            fee: data.fee ?? feeForm,
          },
        });
      }

      setEditMode(false);
      setOkText('Профиль успешно обновлен!');
    } catch (err) {
      setErrorText(
        err instanceof Error ? err.message : 'Ошибка обновления'
      );
    } finally {
      setLoading(false);
    }
  };

  const onLogoutClick = async () => {
    triggerLoader('Выход из системы...');

    try {
      await fetch(ENDPOINTS.logout, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).catch(() => {});
    } finally {
      localStorage.removeItem('band_session');
      setIsLogged(false);
      setMusician(null);
      setEditMode(false);
      setLoading(false);
      setOkText('Вы вышли из системы.');
    }
  };

  return (
    <div>
      <style>{`
        input, select, textarea {
          background-color: #0b0f19 !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #38bdf8 !important;
        }
      `}</style>

      {loading && (
        <div className="loader-backdrop">
          <div className="loader-modal">
            <div className="eq-bars">
              <div className="eq-bar"></div>
              <div className="eq-bar"></div>
              <div className="eq-bar"></div>
              <div className="eq-bar"></div>
            </div>

            <div className="loader-label">{loadingStep}</div>
          </div>
        </div>
      )}

      <div className="top-Ribbon">
        WORLD TOUR 2026 • BISHKEK • OSH • ALMATY • BERLIN • TOKYO
      </div>

      <header className="studio-header">
        <div className="brand-title">
          <span>🎧 QUANTUM ECHO</span>
          <span className="vinyl-badge">Official Portal</span>
        </div>

        <div className="header-controls">
          {isLogged ? (
            <>
              <span className="member-pill">
                👤 {musician?.username || usernameInput}
              </span>

              <button
                className="retro-btn retro-btn-dark"
                onClick={onLogoutClick}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <button
                className={`retro-btn ${mode === 'login' ? 'retro-btn-accent' : ''}`}
                onClick={() => {
                  setMode('login');
                  setErrorText(null);
                }}
              >
                Вход
              </button>

              <button
                className={`retro-btn ${mode === 'register' ? 'retro-btn-accent' : ''}`}
                onClick={() => {
                  setMode('register');
                  setErrorText(null);
                }}
              >
                Регистрация
              </button>
            </>
          )}
        </div>
      </header>

      <main className="workspace">
        <aside className="panel-box">
          {errorText && (
            <div className="notice notice-err">{errorText}</div>
          )}

          {okText && (
            <div className="notice notice-ok">{okText}</div>
          )}

          {!isLogged ? (
            mode === 'login' ? (
              <form onSubmit={onLoginSubmit}>
                <div className="panel-heading">
                  <span>🔐 Вход в систему</span>
                </div>

                <div className="field-row">
                  <label>Логин (Username)</label>
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="Введите логин"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                  />
                </div>

                <div className="field-row">
                  <label>Пароль</label>
                  <input
                    style={inputStyle}
                    type="password"
                    placeholder="Введите пароль"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="retro-btn retro-btn-accent"
                  style={{ width: '100%', padding: '14px' }}
                >
                  Войти в аккаунт
                </button>
              </form>
            ) : (
              <form onSubmit={onRegisterSubmit}>
                <div className="panel-heading">
                  <span>✨ Регистрация</span>
                </div>

                <div className="field-row">
                  <label>Логин (Username)</label>
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="Придумайте логин"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                  />
                </div>

                <div className="field-row">
                  <label>Email</label>
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="user@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>

                <div className="field-row">
                  <label>Пароль</label>
                  <input
                    style={inputStyle}
                    type="password"
                    placeholder="Создайте пароль"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="retro-btn retro-btn-accent"
                  style={{ width: '100%', padding: '14px' }}
                >
                  Зарегистрироваться
                </button>
              </form>
            )
          ) : (
            <div>
              <div className="panel-heading">
                <span>👤 Мой профиль</span>

                <button
                  className="retro-btn"
                  onClick={loadMyProfile}
                  title="Обновить"
                >
                  ↻
                </button>
              </div>

              {!editMode ? (
                <div>
                  <div className="musician-badge-card">
                    <div className="stat-line">
                      <span className="stat-label">ID:</span>
                      <span className="stat-val">
                        #{musician?.id ?? '—'}
                      </span>
                    </div>

                    <div className="stat-line">
                      <span className="stat-label">Логин:</span>
                      <span className="stat-val">
                        {musician?.username}
                      </span>
                    </div>

                    <div className="stat-line">
                      <span className="stat-label">Имя:</span>
                      <span className="stat-val">
                        {musician?.profile?.first_name || 'Не указано'}
                      </span>
                    </div>

                    <div className="stat-line">
                      <span className="stat-label">Специализация:</span>
                      <span className="stat-val">
                        {musician?.profile?.specialization_display ||
                          musician?.profile?.specialization ||
                          'Другое'}
                      </span>
                    </div>

                    <div className="stat-line">
                      <span className="stat-label">Гонорар (Fee):</span>
                      <span className="stat-val">
                        ${musician?.profile?.fee ?? '0.00'}
                      </span>
                    </div>

                    <div className="bio-box">
                      <strong>О себе:</strong>{' '}
                      {musician?.profile?.bio ||
                        'Информация не заполнена.'}
                    </div>
                  </div>

                  <button
                    className="retro-btn retro-btn-accent"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={() => setEditMode(true)}
                  >
                    ✏️ Редактировать профиль
                  </button>
                </div>
              ) : (
                <form onSubmit={onUpdateProfileSubmit}>
                  <div className="field-row">
                    <label>Имя (First Name)</label>
                    <input
                      style={inputStyle}
                      type="text"
                      value={firstNameForm}
                      onChange={(e) => setFirstNameForm(e.target.value)}
                      placeholder="Ваше имя"
                    />
                  </div>

                  <div className="field-row">
                    <label>Специализация</label>
                    <select
                      style={inputStyle}
                      value={specForm}
                      onChange={(e) => setSpecForm(e.target.value)}
                    >
                      {specList.map((sp) => (
                        <option
                          key={sp.value}
                          value={sp.value}
                          style={{ background: '#0b0f19', color: '#fff' }}
                        >
                          {sp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-row">
                    <label>Гонорар ($)</label>
                    <input
                      style={inputStyle}
                      type="number"
                      step="0.01"
                      value={feeForm}
                      onChange={(e) => setFeeForm(e.target.value)}
                    />
                  </div>

                  <div className="field-row">
                    <label>О себе (Bio)</label>
                    <textarea
                      style={inputStyle}
                      rows={3}
                      value={bioForm}
                      onChange={(e) => setBioForm(e.target.value)}
                      placeholder="Пара слов о себе..."
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      className="retro-btn retro-btn-accent"
                      style={{ flex: 1, padding: '12px' }}
                    >
                      Сохранить
                    </button>

                    <button
                      type="button"
                      className="retro-btn"
                      onClick={() => setEditMode(false)}
                      style={{ padding: '12px' }}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </aside>

        <section>
          <div className="poster-banner">
            <h1>МИРОВОЕ ТУРНЕ 2026</h1>
            <p>Официальный портал группы QUANTUM ECHO</p>
          </div>

          <div
            className="panel-box"
            style={{ marginBottom: '28px' }}
          >
            <div className="panel-heading">
              <span>💿 Последние релизы</span>
            </div>

            <div className="albums-grid">
              <div className="vinyl-card">
                <span className="vinyl-year">LP • 2026</span>
                <h3>Neon Horizon</h3>
                <p>
                  Девятый студийный альбом, записанный в Бишкеке и Берлине.
                </p>
              </div>

              <div className="vinyl-card">
                <span className="vinyl-year">EP • 2025</span>
                <h3>Ala-Too Sessions</h3>
                <p>
                  Акустический мини-альбом, записанный во время горных походов.
                </p>
              </div>

              <div className="vinyl-card">
                <span className="vinyl-year">LIVE • 2024</span>
                <h3>Tokyo Live</h3>
                <p>
                  Концертная пластинка с живым звуком со сцены Zepp.
                </p>
              </div>
            </div>
          </div>

          <div className="panel-box">
            <div className="panel">
              <div className="panel-heading">
                <span>🎤 Концерты и события</span>
              </div>

              <p>
                Следите за новостями и анонсами группы QUANTUM ECHO.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;