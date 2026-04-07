"use client";

import axios from "axios";
import { getAuthorizationHeader, getBackendUrl } from "@/app/lib/backend";
import {
  getClientAccessToken,
  waitForClientSessionReady,
} from "@/app/lib/client-session-store";

const api = axios.create();

api.interceptors.request.use(async (config) => {
  config.baseURL = getBackendUrl();
  if (typeof window !== "undefined") {
    await waitForClientSessionReady();
  }

  const accessToken = getClientAccessToken();
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = getAuthorizationHeader(
      accessToken,
    );
  }

  return config;
});

export default api;
