"use client";

import axios from "axios";
import { getSession } from "next-auth/react";
import { getAuthorizationHeader, getBackendUrl } from "@/app/lib/backend";

const api = axios.create();

api.interceptors.request.use(async (config) => {
  config.baseURL = getBackendUrl();
  const session = await getSession();

  if (session?.user?.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = getAuthorizationHeader(
      session.user.accessToken,
    );
  }

  return config;
});

export default api;
