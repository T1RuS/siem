import React, { useContext, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import AuthContext, { AuthProvider } from "./AuthContext";
import "./styles.scss";

const UserProfile = () => {
  const { isLoggedIn, logout, currentUser } = useContext(AuthContext);
  return isLoggedIn ? (
    <p>
      Welcome!
      <span className="user-profile">{currentUser.username}</span>
      <button className="signout" onClick={logout}>
        Sign out
      </button>
    </p>
  ) : (
    <p>You are not logged in!</p>
  );
};

const MainNavBar = () => (
  <ul className="navbar">
    <li>
      <NavLink to="/register" activeClassName="active-link">
        Register
      </NavLink>
    </li>
    <li>
      <NavLink to="/login" activeClassName="active-link">
        Login
      </NavLink>
    </li>
    <li>
      <NavLink to="/dashboard" activeClassName="active-link">
        Dashboard
      </NavLink>
    </li>
  </ul>
);

const DashboardNavBar = ({ permissions }) => (
  <ul className="navbar">
    <li>
      <NavLink to="/dashboard/" exact activeClassName="active-link">
        Welcome
      </NavLink>
    </li>
    <li>
      <NavLink to="/dashboard/all-users" activeClassName="active-link">
        Users
      </NavLink>
    </li>
    <li>
      <NavLink to="/dashboard/edit-user" activeClassName="active-link">
        Edit
      </NavLink>
    </li>
    {permissions.canManageSettings && (
      <li>
        <NavLink to="/dashboard/settings">Settings</NavLink>
      </li>
    )}
  </ul>
);

const DashboardSummary = () => (
  <>
    <h2>Summary</h2>
    <p>Welcome Sceren! All Authenticated Users can access this View</p>
  </>
);

const AllUsersView = () => (
  <>
    <h2>All users</h2>
    <p>User list here. View Accessble with View Permission</p>
  </>
);

const EditUserView = ({ canEdit }) =>
  canEdit ? (
    <>
      <h2>Edit User</h2>
      <p>Detais of some User to Edit</p>
      <p>View Accessble with Edit Permission</p>
    </>
  ) : (
    <Navigate to="/dashboard/" />
  );
const SettingsView = ({ hasSettings }) => {
  return hasSettings ? (
    <>
      <h2>Settings</h2>
      <p>View Accessble with Settings Permission</p>
    </>
  ) : (
    <Navigate from="/dashbaord/settings" to="/dashbaord" />
  );
};

const DashboardPage = () => {
  const { currentUser } = useContext(AuthContext);
  const { permissions } = currentUser;

  const canViewUsers = permissions.includes("view-users");
  const canEditUsers = permissions.includes("edit-user");
  const canManageSettings = permissions.includes("manage-settings");

  return (
    <>
      <h1>Dashboard</h1> залогинины
    </>
  );
};

const LoginPage = () => {
  const history = useNavigate();
  let location = useLocation();
  const { isLoggedIn, login } = useContext(AuthContext);

  const { from } = location.state || { from: { pathname: "/" } };
  const { pathname } = from;

  let handleLogin = (userId) => {
    login({ userId, history, from });
  };

  const [loginField, setLoginField] = useState("");
  const [passwordField, fasswordField] = useState("");

  const handlerAuth = async () => {
    try {
      if (location.pathname === "/register") {
      handleLogin("client-1");
      let response = await fetch(`http://127.0.0.1:8000/register?username=${loginField}&password=${passwordField}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        }
      });
    }

    if (location.pathname === "/login") {
      let response = await fetch(`http://127.0.0.1:8000/token?username=${loginField}&password=${passwordField}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        }
      });

      const res_data = await response.json();

      window.localStorage.setItem("access_token", res_data.access_token)

      console.log(res_data)
      handleLogin("client-1");
    }} catch (error ) {console.log(error)}
    


  };
  return isLoggedIn ? (
    "я залогинин"
  ) : (
    <div className="login-btns">
      {pathname !== "/" && (
        <p>You must log in to view the page at {pathname}</p>
      )}
      {pathname === "/" && (
        <div>
          <input
            placeholder="login"
            value={loginField}
            onInput={(event) => setLoginField(event.target.value)}
            type="text"
          />
          <input
            type="password"
            placeholder="password"
            value={passwordField}
            onInput={(event) => fasswordField(event.target.value)}
          />
          <button onClick={handlerAuth}>Зайти</button>
        </div>
      )}
    </div>
  );
};



const DashboardPage2 = () => {
  const history = useNavigate();
  let location = useLocation();

  const { from } = location.state || { from: { pathname: "/" } };
  const { pathname } = from;
  const bearer = 'Bearer ' + window.localStorage.getItem('access_token');

  const [massage, setMassage] = useState('')

  const buf = () => {
    try {
      let response = fetch(`http://127.0.0.1:8000/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': bearer,
          'Content-Type': 'application/json;charset=utf-8'
        }
      }).then(res => {
        if (res.ok) {
          setMassage('Залогинины.')
        } 
        else {
          setMassage('Пожалуйста войдите в систему.')
        }
      });
    } catch (error) {}

    

  } 

  useEffect( () => {
    buf()
  }, [pathname]);

  return (
    <>
      <h1>Dashboard</h1> {massage}
    </>
  );
};


const AuthedComponents = () => {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <div>
      <Router>
      <div>
        <h1>{` 🔐 App `}</h1>
        <UserProfile />
        <MainNavBar />

        <hr />
        <Routes>
          <Route path="/login" element={<LoginPage />} exact/>
          <Route path="/register" element={<LoginPage />} exact/>
          <Route path="/dashboard" element={<DashboardPage2/>} exact/>
        </Routes>
      </div>
    </Router>
    </div>
    
  );
};

const App = () => (
  <AuthProvider>
    <div className="App">
      <AuthedComponents />
    </div>
  </AuthProvider>
);

export default App;
