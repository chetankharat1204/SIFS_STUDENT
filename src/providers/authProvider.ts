import type { AuthProvider } from 'react-admin';

const authProvider: AuthProvider = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: async ({ username, password }: any) => {
    // call your login endpoint
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password }),
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    // store token (change to your response structure)
    localStorage.setItem("token", data.token);
  },

  logout: async () => {
    localStorage.removeItem("sifsStudentAuthToken");
    localStorage.removeItem("studentData");
    localStorage.removeItem("dashboard-active-tab");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return Promise.resolve();
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (token) return Promise.resolve();
    return Promise.reject();
  },

  getPermissions: async () => Promise.resolve(),

  checkError: () => {
    // implement if you want to handle 401/403
    return Promise.resolve();
  }
};

export default authProvider;
