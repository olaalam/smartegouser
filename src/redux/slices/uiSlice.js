import { createSlice } from "@reduxjs/toolkit";

const stored = {
  lang:  localStorage.getItem("lang")  ?? "en",
  theme: localStorage.getItem("theme") ?? "light",
};

// Apply theme to <html> on boot
document.documentElement.classList.toggle("dark", stored.theme === "dark");
document.documentElement.dir = stored.lang === "ar" ? "rtl" : "ltr";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    lang:  stored.lang,
    theme: stored.theme,
  },
  reducers: {
    setLang: (state, action) => {
      state.lang = action.payload;
      localStorage.setItem("lang", action.payload);
      document.documentElement.dir = action.payload === "ar" ? "rtl" : "ltr";
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", state.theme);
      document.documentElement.classList.toggle("dark", state.theme === "dark");
    },
  },
});

export const { setLang, toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;
