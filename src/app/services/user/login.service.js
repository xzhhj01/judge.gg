import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

export const loginService = {

    async login(idToken) {
        try{        
            const response = await axios.post(
              `${API_BASE_URL}/api/auth/google`,
              {idToken},
              )
              console.log("여기여기여기여ㅣㄱ")
              console.log(response.data.token);
              return "aa";
            }catch(error){
                throw error.response?.data || error.message;
        }
    },

};
