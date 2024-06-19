import axios from "axios";

const axiosInstance = axios.create({
    baseURL:'https://scribble-backend-8ikx.onrender.com',
    timeout:10000,
    header:{
        "Content_Type": "application/json",
    },
});

axiosInstance.interceptors.request.use(
    (config)=>{
        const accessToken = localStorage.getItem('token');
        if(accessToken){
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }
);

export default axiosInstance;