import axios, { AxiosInstance, AxiosError } from "axios";

const instance: AxiosInstance = axios.create({
  baseURL: "http://10.0.0.99:8888",
});

const handleError = (error: AxiosError) => {
  console.log(error);
};

// Add response interceptors
instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    handleError(error);
    return Promise.reject(error);
  },
);

export const client = instance;
